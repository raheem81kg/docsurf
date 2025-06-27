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
   getEditor: () => Editor | null,
   getDoc: () => any,
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
      const editor = getEditor();
      const doc = getDoc();
      // const { refetchUsage } = useUsageStore.getState();
      console.log("[InlineSuggestionCallback] requestInlineSuggestionCallback called", state);
      if (!editor || !doc) {
         console.log("[Editor Component] No editor or doc found", editor, doc);
         return;
      }

      // Accessibility: TODO - Ensure suggestion UI uses ARIA roles and is keyboard accessible.

      // Memoization key: contextBefore + contextAfter + doc.uuid
      const cacheKey = `${doc.uuid}::${contextBefore}::${contextAfter}`;
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
         if (contextBefore.length < 3) {
            showToast("Please type at least 3 characters to get a suggestion.", "warning");
            editor.view?.dispatch(editor.state.tr.setMeta(CLEAR_SUGGESTION, true));
            return;
         }

         console.log("[Editor Component] Requesting inline suggestion via plugin callback...");

         // const { suggestionLength, customInstructions } = getAiOptions();

         // --- p-retry fetch with abort support ---
         const fetchSuggestion = async (): Promise<Response> => {
            const response = await fetch("/api/inline-suggestion", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  documentId: doc.uuid,
                  currentContent: contextBefore,
                  contextAfter,
                  fullContent,
                  nodeType: "paragraph",
                  aiOptions: {
                     // suggestionLength: suggestionLength,
                     // customInstructions: customInstructions,
                  },
               }),
               signal: controller.signal,
            });

            if (!response.body) {
               throw new Error("server");
            }

            return response;
         };

         let response: Response;
         try {
            response = await pRetry(fetchSuggestion, {
               retries: 1,
               maxTimeout: 10000,
               onFailedAttempt: (error) => {
                  if (controller.signal.aborted) throw new AbortError(error);
               },
            });

            if (!response.ok) {
               const errorData = await response.json();
               throw { ...errorData }; // Spread the error object to preserve its structure
            }
         } catch (error) {
            console.log("--------------------------------");
            console.log("[Editor Component] Error:", error);
            console.log("--------------------------------");
            if (error instanceof AbortError) {
               console.log("[Editor Component] Suggestion request aborted.");
               editor.view?.dispatch(editor.state.tr.setMeta(CLEAR_SUGGESTION, true));
               return;
            }
            // Check if it's a rate limit error using the code property
            const errorObj = error as { code?: string; error?: string };
            // if (errorObj?.code === RATE_LIMIT_REACHED) {
            //    showToast("You've reached your daily limit. Please try again tomorrow.", "warning");
            // } else {
            showToast(errorObj?.error || "Could not get a suggestion right now. Please try again shortly.", "error");
            // }
            editor.view?.dispatch(editor.state.tr.setMeta(CLEAR_SUGGESTION, true));
            return;
         }

         // --- Stream and parse response ---
         if (!response.body) {
            throw new Error("server");
         }
         const reader = response.body.getReader();
         const decoder = new TextDecoder();
         let accumulatedSuggestion = "";
         let receivedAnyData = false;

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
                        receivedAnyData = true;
                        editor.view?.dispatch(editor.state.tr.setMeta(SET_SUGGESTION, { text: accumulatedSuggestion }));
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
            // Cache the suggestion for this context
            suggestionCache.set(cacheKey, accumulatedSuggestion);
            console.log("[Editor Component] Stream finished, dispatching FINISH_SUGGESTION_LOADING");
            editor.view?.dispatch(editor.state.tr.setMeta(FINISH_SUGGESTION_LOADING, true));
            // Refetch usage after successful suggestion
            // await refetchUsage();
         } else if (controller.signal.aborted) {
            console.log("[Editor Component] Suggestion request aborted.");
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
