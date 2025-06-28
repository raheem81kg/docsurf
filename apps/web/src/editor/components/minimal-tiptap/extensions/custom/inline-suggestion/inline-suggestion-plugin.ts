import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { Extension } from "@tiptap/react";

export interface InlineSuggestionState {
   suggestionText: string | null;
   suggestionPos: number | null;
   isLoading: boolean;
}

export const inlineSuggestionPluginKey = new PluginKey<InlineSuggestionState>("inlineSuggestion");

const initialState: InlineSuggestionState = {
   suggestionText: null,
   suggestionPos: null,
   isLoading: false,
};

export const START_SUGGESTION_LOADING = "startSuggestionLoading";
export const SET_SUGGESTION = "setSuggestion";
export const CLEAR_SUGGESTION = "clearSuggestion";
export const FINISH_SUGGESTION_LOADING = "finishSuggestionLoading";

// Add debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
   let timer: ReturnType<typeof setTimeout> | null = null;
   return (...args: Parameters<T>) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
   };
}

// Context window constants
const CONTEXT_LENGTH = 300;
const ENABLE_CONTEXT_AFTER_CURSOR = true;

// Add type declaration for window property
declare global {
   interface Window {
      __inlineSuggestionLastRequest?: number;
   }
}

/**
 * ProseMirror/Tiptap plugin for inline suggestions with context windowing.
 * Extracts context before and optionally after the cursor for AI suggestions.
 *
 * - CONTEXT_LENGTH: Number of characters before/after cursor to include (default 300)
 * - ENABLE_CONTEXT_AFTER_CURSOR: Toggle to include after-cursor context
 */

// Update options interface to support debounceMs and contextLength
export interface InlineSuggestionOptions {
   /**
    * Called to request a suggestion. Receives state, contextBefore, contextAfter, and forceRefresh.
    */
   requestSuggestion: (state: EditorState, contextBefore: string, contextAfter: string, forceRefresh?: boolean) => void;
   debounceMs?: number;
   contextLength?: number;
   enableContextAfterCursor?: boolean;
}

export function inlineSuggestionPlugin(options: InlineSuggestionOptions): Plugin<InlineSuggestionState> {
   const debounceMs = options.debounceMs ?? 500;
   const contextLength = options.contextLength ?? CONTEXT_LENGTH;
   const enableContextAfterCursor = options.enableContextAfterCursor ?? ENABLE_CONTEXT_AFTER_CURSOR;
   // Debounced requestSuggestion
   const debouncedRequestSuggestion = debounce(
      (state: EditorState, contextBefore: string, contextAfter: string, forceRefresh?: boolean) => {
         console.log("[InlineSuggestionPlugin] debouncedRequestSuggestion called", { state, contextBefore, contextAfter });
         console.log(
            "[InlineSuggestionPlugin] calling requestSuggestion",
            options.requestSuggestion,
            state,
            contextBefore,
            contextAfter
         );
         options.requestSuggestion(state, contextBefore, contextAfter, forceRefresh);
      },
      debounceMs
   );
   return new Plugin<InlineSuggestionState>({
      key: inlineSuggestionPluginKey,
      state: {
         init(): InlineSuggestionState {
            return initialState;
         },
         apply(
            tr: Transaction,
            pluginState: InlineSuggestionState,
            _oldState: EditorState,
            newState: EditorState
         ): InlineSuggestionState {
            const metaStart = tr.getMeta(START_SUGGESTION_LOADING);
            const metaSet = tr.getMeta(SET_SUGGESTION);
            const metaClear = tr.getMeta(CLEAR_SUGGESTION);
            const metaFinish = tr.getMeta(FINISH_SUGGESTION_LOADING);

            if (metaStart) {
               const pos = newState.selection.head;
               return { suggestionText: null, isLoading: true, suggestionPos: pos };
            }

            if (metaSet) {
               const { text } = metaSet as { text: string };
               if (pluginState.isLoading && pluginState.suggestionPos === newState.selection.head) {
                  return { ...pluginState, suggestionText: text };
               }
               return pluginState;
            }

            if (metaFinish) {
               if (pluginState.isLoading && pluginState.suggestionPos !== null) {
                  return { ...pluginState, isLoading: false };
               }
               return initialState;
            }

            if (metaClear) {
               return initialState;
            }

            if (pluginState.suggestionPos !== null && (pluginState.isLoading || pluginState.suggestionText)) {
               if (tr.docChanged || !newState.selection.empty || newState.selection.head !== pluginState.suggestionPos) {
                  return initialState;
               }
            }

            return pluginState;
         },
      },
      props: {
         decorations(state: EditorState): DecorationSet | null {
            const pluginState = inlineSuggestionPluginKey.getState(state);
            if (!pluginState?.suggestionText || pluginState.suggestionPos === null) {
               return null;
            }
            const decoration = Decoration.widget(
               pluginState.suggestionPos,
               () => {
                  const wrapper = document.createElement("span");
                  wrapper.className = "inline-suggestion-wrapper";

                  const suggestionSpan = document.createElement("span");
                  suggestionSpan.className = "suggestion-decoration-inline";
                  suggestionSpan.setAttribute("data-suggestion", pluginState.suggestionText || "");
                  wrapper.appendChild(suggestionSpan);

                  const kbd = document.createElement("kbd");
                  kbd.className = "inline-tab-icon";
                  kbd.style.marginLeft = "0.25em";
                  kbd.textContent = "Ctrl+Space";
                  wrapper.appendChild(kbd);

                  return wrapper;
               },
               { side: 1 }
            );
            return DecorationSet.create(state.doc, [decoration]);
         },
         handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
            // console.log("[InlineSuggestionPlugin] Keydown event", event.key, event.ctrlKey, event.shiftKey, event);
            const pluginState = inlineSuggestionPluginKey.getState(view.state);
            if (!pluginState) return false;

            // Double hotkey detection state
            if (!window.__inlineSuggestionLastRequest) {
               window.__inlineSuggestionLastRequest = 0;
            }
            const now = Date.now();
            const DOUBLE_HOTKEY_THRESHOLD = 600; // ms

            // Trigger suggestion on Control+Space (robust key check)
            if ((event.key === " " || event.key === "Spacebar" || event.key === "Space") && event.ctrlKey) {
               if (pluginState.suggestionText && pluginState.suggestionPos !== null) {
                  event.preventDefault();
                  let text = pluginState.suggestionText;
                  if (pluginState.suggestionPos > 0) {
                     const prevChar = view.state.doc.textBetween(pluginState.suggestionPos - 1, pluginState.suggestionPos);
                     if (/\w|[\.\?!,;:]/.test(prevChar) && !text.startsWith(" ")) {
                        text = " " + text;
                     }
                  }
                  let tr = view.state.tr.insertText(text, pluginState.suggestionPos);
                  tr = tr.setMeta(CLEAR_SUGGESTION, true);
                  tr = tr.scrollIntoView();
                  view.dispatch(tr);
                  return true;
               }
               event.preventDefault();
               // Block node awareness: don't trigger suggestion if at a block node
               const { doc, selection } = view.state;
               const node = doc.nodeAt(selection.head);
               if (node && node.isBlock) {
                  return false;
               }
               view.dispatch(view.state.tr.setMeta(START_SUGGESTION_LOADING, true));
               // Get context for suggestion (before and after cursor, spanning multiple nodes)
               const { head } = selection;
               const from = Math.max(0, head - CONTEXT_LENGTH);
               const contextBefore = doc.textBetween(from, head, " ");
               let contextAfter = "";
               if (ENABLE_CONTEXT_AFTER_CURSOR) {
                  const docSize = doc.content.size;
                  contextAfter = doc.textBetween(head, Math.min(docSize, head + CONTEXT_LENGTH), " ");
               }
               // Double hotkey detection
               let forceRefresh = false;
               if (now - window.__inlineSuggestionLastRequest < DOUBLE_HOTKEY_THRESHOLD) {
                  forceRefresh = true;
               }
               window.__inlineSuggestionLastRequest = now;
               debouncedRequestSuggestion(view.state, contextBefore, contextAfter, forceRefresh);
               return true;
            }

            if (event.key === "Escape" && (pluginState.suggestionText || pluginState.isLoading)) {
               event.preventDefault();
               view.dispatch(view.state.tr.setMeta(CLEAR_SUGGESTION, true));
               return true;
            }

            return false;
         },
      },
   });
}

/**
 * Tiptap extension for inline suggestions, wrapping the ProseMirror plugin.
 * Accepts the same options as inlineSuggestionPlugin.
 */
export const InlineSuggestionExtension = Extension.create<InlineSuggestionOptions>({
   name: "inlineSuggestion",
   addProseMirrorPlugins() {
      return [inlineSuggestionPlugin(this.options)];
   },
});
