/**
 * Factory for the inline suggestion callback used by the inline suggestion plugin.
 * Accepts a getEditor function and a getDoc function to always access the latest editor and doc from useDocStore.
 *
 * @param getEditor - Function returning the current Tiptap Editor instance
 * @param getDoc - Function returning the current document from useDocStore
 * @param abortControllerRef - Ref for managing aborting fetch requests
 * @returns Callback for requesting inline suggestions
 *
 * The callback now receives contextBefore and contextAfter as arguments.
 */
import { EditorState } from "@tiptap/pm/state";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { SET_SUGGESTION, CLEAR_SUGGESTION, FINISH_SUGGESTION_LOADING } from "./inline-suggestion-plugin";
import type { Editor } from "@tiptap/react";
// import { getAiOptions } from "@/store/use-ai-options-store";
import pRetry, { AbortError } from "p-retry";
import { LRUCache } from "lru-cache";
// import { RATE_LIMIT_REACHED } from "@/lib/api";
// import { useUsageStore } from "@/store/use-usage-store";
import { useEditorRefStore } from "@/store/use-editor-ref-store";

// --- Types ---
interface InlineSuggestionApiResponse {
   type: "suggestion-delta" | "error" | "finish";
   content: string;
   code?: string;
   error?: string;
}

// --- Memoization Cache ---
const suggestionCache = new LRUCache<string, string>({
   max: 100, // Adjust as needed
   ttl: 1000 * 60 * 5, // 5 minutes
});

export function createRequestInlineSuggestionCallback(
   userId: string | undefined,
   docId: string | undefined,
   workspaceId: string | undefined,
   abortControllerRef: React.RefObject<AbortController | null>
) {
   /**
    * Requests an inline suggestion using the provided context.
    * @param state - The current EditorState
    * @param contextBefore - Text before the cursor (context window)
    * @param contextAfter - Text after the cursor (context window)
    * @param forceRefresh - If true, bypasses the cache and fetches a new suggestion
    */
   return async (state: EditorState, contextBefore: string, contextAfter = "", forceRefresh?: boolean) => {
      const editor = useEditorRefStore.getState().editor;
      // const { refetchUsage } = useUsageStore.getState();
      console.log("[InlineSuggestionCallback] requestInlineSuggestionCallback called", state);
      if (!editor || !docId || !userId) {
         console.log("[Editor Component] No editor or docId or userId found", editor, docId, userId);
         return;
      }

      // Accessibility: TODO - Ensure suggestion UI uses ARIA roles and is keyboard accessible.

      // Memoization key: contextBefore + contextAfter + docId + userId
      const cacheKey = `${docId}::${workspaceId ?? ""}::${userId ?? ""}::${contextBefore}::${contextAfter}`;
      if (!forceRefresh && suggestionCache.has(cacheKey)) {
         const cachedSuggestion = suggestionCache.get(cacheKey) || "";
         editor.view?.dispatch(editor.state.tr.setMeta(SET_SUGGESTION, { text: cachedSuggestion }));
         editor.view?.dispatch(editor.state.tr.setMeta(FINISH_SUGGESTION_LOADING, true));
         return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
         const fullContent = state.doc.textContent;

         console.log("[Editor Component] Requesting inline suggestion via plugin callback...");

         // const { suggestionLength, customInstructions } = getAiOptions();

         // --- Real fetch to /api/inline-suggestion, streaming chunks ---
         const params = new URLSearchParams({
            documentId: docId,
            userId: userId,
            currentContent: contextBefore,
            contextAfter,
            workspaceId: workspaceId ?? "",
         });
         const response = await fetch(`/api/inline-suggestion?${params.toString()}`, {
            method: "GET",
            signal: controller.signal,
         });
         if (!response.body) {
            throw new Error("server");
         }
         const reader = response.body.getReader();
         const decoder = new TextDecoder();
         let accumulatedSuggestion = "";
         while (true) {
            const { done, value } = await reader.read();
            if (done || controller.signal.aborted) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n\n");
            for (const line of lines) {
               if (line.startsWith("data: ")) {
                  try {
                     const data = JSON.parse(line.slice(6)) as InlineSuggestionApiResponse;
                     if (data.type === "suggestion-delta") {
                        accumulatedSuggestion += data.content;
                        // Remove leading and trailing whitespace for display
                        const displaySuggestion = accumulatedSuggestion.trim();
                        editor.view?.dispatch(editor.state.tr.setMeta(SET_SUGGESTION, { text: displaySuggestion }));
                     } else if (data.type === "error") {
                        throw new Error("ai");
                     } else if (data.type === "finish") {
                        break;
                     }
                  } catch (err) {
                     // Ignore parse errors for now
                  }
               }
            }
         }
         if (!controller.signal.aborted) {
            suggestionCache.set(cacheKey, accumulatedSuggestion);
            editor.view?.dispatch(editor.state.tr.setMeta(FINISH_SUGGESTION_LOADING, true));
         } else {
            editor.view?.dispatch(editor.state.tr.setMeta(CLEAR_SUGGESTION, true));
         }
      } catch (error: any) {
         if (error.name === "AbortError") {
            // User cancelled, do nothing
            return;
         }
         // User-friendly error messages
         let message = "";
         if (error.message === "server") {
            message = "The server is busy. Please try again soon.";
         } else if (error.message === "ai") {
            // Don't show toast here as it's already shown in the error handler above
            message = "Sorry, we couldn't generate a suggestion right now.";
         } else {
            message = "Something went wrong. Please try again.";
         }
         if (message) {
            showToast(message, "error");
         }
         if (editor) {
            editor.view?.dispatch(editor.state.tr.setMeta(CLEAR_SUGGESTION, true));
         }
      } finally {
         if (abortControllerRef.current && abortControllerRef.current.signal === controller.signal) {
            abortControllerRef.current = null;
         }
      }
   };
}
