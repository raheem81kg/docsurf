import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { Extension } from "@tiptap/core";
import { addSwipeRightListener } from "./swipe";

// Mobile detection utility
export const INLINE_SUGGESTION_MOBILE_BREAKPOINT = 640; // Standard phone breakpoint (sm in Tailwind)
const isMobile = () => typeof window !== "undefined" && window.innerWidth < INLINE_SUGGESTION_MOBILE_BREAKPOINT;

export interface InlineSuggestionState {
   suggestionText: string | null;
   suggestionPos: number | null;
   isLoading: boolean;
   cachedSuggestion?: {
      text: string;
      pos: number;
      contextBefore: string;
      contextAfter: string;
      docSize: number; // Track document size when suggestion was cached
      timestamp: number; // Track when suggestion was cached
   } | null;
}

export const inlineSuggestionPluginKey = new PluginKey<InlineSuggestionState>("inlineSuggestion");

const initialState: InlineSuggestionState = {
   suggestionText: null,
   suggestionPos: null,
   isLoading: false,
   cachedSuggestion: null,
};

export const START_SUGGESTION_LOADING = "startSuggestionLoading";
export const SET_SUGGESTION = "setSuggestion";
export const CLEAR_SUGGESTION = "clearSuggestion";
export const FINISH_SUGGESTION_LOADING = "finishSuggestionLoading";
export const ACCEPT_SUGGESTION = "acceptSuggestion";

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

// Typing threshold - clear cache if user types this many characters
const TYPING_THRESHOLD = 5;

// Cache expiration time in milliseconds (20 seconds)
const CACHE_EXPIRATION_MS = 20 * 1000;

// Add type declaration for window property
declare global {
   interface Window {
      __inlineSuggestionLastRequest?: number;
   }
}

// Update options interface to support debounceMs and contextLength
export interface InlineSuggestionOptions {
   /**
    * Called to request a suggestion. Receives state, contextBefore, contextAfter, and forceRefresh.
    */
   requestSuggestion: (state: EditorState, contextBefore: string, contextAfter: string, forceRefresh?: boolean) => void;
   debounceMs?: number;
   contextLength?: number;
   enableContextAfterCursor?: boolean;
   typingThreshold?: number;
}

/**
 * ProseMirror/Tiptap plugin for inline suggestions with context windowing.
 * Extracts context before and optionally after the cursor for AI suggestions.
 *
 * Trigger methods:
 * - Ctrl+Space: Manual trigger for suggestions
 * - "++": Type two plus signs to automatically trigger suggestions (reliable cross-browser detection)
 *
 * Accept methods:
 * - Ctrl+Space: Accept current suggestion (when suggestion is visible)
 * - Right Arrow: Accept current suggestion (when suggestion is visible)
 * - Swipe Right: Accept current suggestion on mobile/touch devices (when suggestion is visible)
 * - Click decorator: Click the "Ctrl+Space" or "Swipe right →" button to accept
 *
 * Features:
 * - CONTEXT_LENGTH: Number of characters before/after cursor to include (default 300)
 * - ENABLE_CONTEXT_AFTER_CURSOR: Toggle to include after-cursor context
 * - TYPING_THRESHOLD: Clear cached suggestions if user types this many characters (default 5)
 * - Glowing cursor animation during loading state
 * - Mobile touch gesture support for accepting suggestions
 * - Responsive UI: Shows "Ctrl+Space" on desktop, "Swipe right →" on mobile
 * - Clickable acceptance button with hover/active states
 * - Smart caching: Suggestions are cached and restored when returning to the same position with identical context
 * - Time-based cache expiration: Cached suggestions expire after 20 seconds
 * - Adaptive cache clearing: Cache is cleared when user types extensively, indicating active writing
 */

export function inlineSuggestionPlugin(options: InlineSuggestionOptions): Plugin<InlineSuggestionState> {
   const debounceMs = options.debounceMs ?? 500;
   const contextLength = options.contextLength ?? CONTEXT_LENGTH;
   const enableContextAfterCursor = options.enableContextAfterCursor ?? ENABLE_CONTEXT_AFTER_CURSOR;
   const typingThreshold = options.typingThreshold ?? TYPING_THRESHOLD;

   // Store swipe listener cleanup function
   let swipeListenerCleanup: (() => void) | null = null;

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
            const metaAccept = tr.getMeta(ACCEPT_SUGGESTION);

            if (metaStart) {
               const pos = newState.selection.head;
               return { ...pluginState, suggestionText: null, isLoading: true, suggestionPos: pos };
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
                  // Cache the suggestion when finishing loading
                  const pos = pluginState.suggestionPos;
                  const contextBefore = newState.doc.textBetween(Math.max(0, pos - contextLength), pos, " ");
                  const contextAfter = newState.doc.textBetween(pos, Math.min(newState.doc.content.size, pos + contextLength), " ");

                  return {
                     ...pluginState,
                     isLoading: false,
                     cachedSuggestion: pluginState.suggestionText
                        ? {
                             text: pluginState.suggestionText,
                             pos,
                             contextBefore,
                             contextAfter,
                             docSize: newState.doc.content.size,
                             timestamp: Date.now(),
                          }
                        : pluginState.cachedSuggestion,
                  };
               }
               return { ...pluginState, isLoading: false };
            }

            if (metaClear || metaAccept) {
               // Clear both current and cached suggestions when explicitly clearing or accepting
               return initialState;
            }

            // Check for expired cache entries
            if (pluginState.cachedSuggestion) {
               const now = Date.now();
               const cacheAge = now - pluginState.cachedSuggestion.timestamp;

               if (cacheAge > CACHE_EXPIRATION_MS) {
                  return {
                     ...pluginState,
                     cachedSuggestion: null,
                  };
               }
            }

            // Check for excessive typing that should clear cached suggestions
            if (pluginState.cachedSuggestion && tr.docChanged) {
               const currentDocSize = newState.doc.content.size;
               const originalDocSize = pluginState.cachedSuggestion.docSize;
               const sizeIncrease = currentDocSize - originalDocSize;

               // If user typed significantly more content, clear the cache
               if (sizeIncrease >= typingThreshold) {
                  return {
                     ...pluginState,
                     cachedSuggestion: null,
                  };
               }
            }

            // Simplified state clearing logic - don't interfere with streaming
            if (pluginState.suggestionPos !== null && (pluginState.isLoading || pluginState.suggestionText)) {
               if (tr.docChanged || !newState.selection.empty || newState.selection.head !== pluginState.suggestionPos) {
                  return {
                     suggestionText: null,
                     suggestionPos: null,
                     isLoading: false,
                     cachedSuggestion: pluginState.cachedSuggestion,
                  };
               }
            }

            // Check if cursor returned to a cached suggestion position (only when not actively streaming)
            if (!pluginState.suggestionText && !pluginState.isLoading && pluginState.cachedSuggestion) {
               const { head } = newState.selection;
               const cached = pluginState.cachedSuggestion;

               // Check if we're at the same position and context matches
               if (head === cached.pos && newState.selection.empty) {
                  const currentContextBefore = newState.doc.textBetween(Math.max(0, head - contextLength), head, " ");
                  const currentContextAfter = newState.doc.textBetween(
                     head,
                     Math.min(newState.doc.content.size, head + contextLength),
                     " "
                  );

                  // If context matches exactly, restore the cached suggestion instantly
                  if (currentContextBefore === cached.contextBefore && currentContextAfter === cached.contextAfter) {
                     return {
                        ...pluginState,
                        suggestionText: cached.text,
                        suggestionPos: cached.pos,
                     };
                  }

                  // Context changed slightly - clear the stale cache
                  return {
                     ...pluginState,
                     cachedSuggestion: null,
                  };
               }
            }

            return pluginState;
         },
      },
      props: {
         decorations(state: EditorState): DecorationSet | null {
            const pluginState = inlineSuggestionPluginKey.getState(state);
            if (!pluginState || pluginState.suggestionPos === null) {
               return null;
            }

            // Show suggestion text when available (prioritize over loading cursor)
            if (pluginState.suggestionText) {
               const decoration = Decoration.widget(
                  pluginState.suggestionPos,
                  (view) => {
                     const wrapper = document.createElement("span");
                     wrapper.className = "inline-suggestion-wrapper";

                     const suggestionSpan = document.createElement("span");
                     suggestionSpan.className = "suggestion-decoration-inline";
                     suggestionSpan.setAttribute("data-suggestion", pluginState.suggestionText || "");
                     wrapper.appendChild(suggestionSpan);

                     const kbd = document.createElement("kbd");
                     kbd.className = "inline-tab-icon";
                     kbd.style.marginLeft = "0.25em";
                     kbd.style.cursor = "pointer";

                     // Set text based on device type
                     if (isMobile()) {
                        kbd.textContent = "Swipe right →";
                     } else {
                        kbd.textContent = "Ctrl+Space";
                     }

                     // Add click handler to accept suggestion
                     kbd.addEventListener("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Accept the suggestion
                        const currentPluginState = inlineSuggestionPluginKey.getState(view.state);
                        if (currentPluginState?.suggestionText && currentPluginState.suggestionPos !== null) {
                           let text = currentPluginState.suggestionText;
                           if (currentPluginState.suggestionPos > 0) {
                              const prevChar = view.state.doc.textBetween(
                                 currentPluginState.suggestionPos - 1,
                                 currentPluginState.suggestionPos
                              );
                              if (/\w|[\.\?!,;:]/.test(prevChar) && !text.startsWith(" ")) {
                                 text = " " + text;
                              }
                           }
                           let tr = view.state.tr.insertText(text, currentPluginState.suggestionPos);
                           tr = tr.setMeta(ACCEPT_SUGGESTION, true);
                           tr = tr.scrollIntoView();
                           view.dispatch(tr);
                        }
                     });

                     wrapper.appendChild(kbd);

                     return wrapper;
                  },
                  { side: 1 }
               );
               return DecorationSet.create(state.doc, [decoration]);
            }

            // Show glowing cursor when loading (and no suggestion text yet)
            if (pluginState.isLoading) {
               const loadingDecoration = Decoration.widget(
                  pluginState.suggestionPos,
                  () => {
                     const cursor = document.createElement("span");
                     cursor.className = "inline-suggestion-loading-cursor";
                     return cursor;
                  },
                  { side: 1 }
               );
               return DecorationSet.create(state.doc, [loadingDecoration]);
            }

            return null;
         },
         handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
            const pluginState = inlineSuggestionPluginKey.getState(view.state);
            if (!pluginState) return false;

            // Double hotkey detection state
            if (!window.__inlineSuggestionLastRequest) {
               window.__inlineSuggestionLastRequest = 0;
            }
            const now = Date.now();
            const DOUBLE_HOTKEY_THRESHOLD = 600; // ms

            // Helper function to trigger suggestion
            const triggerSuggestion = (forceRefresh = false) => {
               // Block node awareness: don't trigger suggestion if at a block node
               const { doc, selection } = view.state;
               const node = doc.nodeAt(selection.head);
               if (node && node.isBlock) {
                  return false;
               }
               view.dispatch(view.state.tr.setMeta(START_SUGGESTION_LOADING, true));
               // Get context for suggestion (before and after cursor, spanning multiple nodes)
               const { head } = selection;
               const from = Math.max(0, head - contextLength);
               const contextBefore = doc.textBetween(from, head, " ");
               let contextAfter = "";
               if (enableContextAfterCursor) {
                  const docSize = doc.content.size;
                  contextAfter = doc.textBetween(head, Math.min(docSize, head + contextLength), " ");
               }
               debouncedRequestSuggestion(view.state, contextBefore, contextAfter, forceRefresh);
               return true;
            };

            // Trigger suggestion on Ctrl+Space (robust key check)
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
                  tr = tr.setMeta(ACCEPT_SUGGESTION, true);
                  tr = tr.scrollIntoView();
                  view.dispatch(tr);
                  return true;
               }
               event.preventDefault();

               // Double hotkey detection
               let forceRefresh = false;
               if (now - window.__inlineSuggestionLastRequest < DOUBLE_HOTKEY_THRESHOLD) {
                  forceRefresh = true;
               }
               window.__inlineSuggestionLastRequest = now;
               return triggerSuggestion(forceRefresh);
            }

            // Accept suggestion with right arrow key
            if (event.key === "ArrowRight" && pluginState.suggestionText && pluginState.suggestionPos !== null) {
               event.preventDefault();
               let text = pluginState.suggestionText;
               if (pluginState.suggestionPos > 0) {
                  const prevChar = view.state.doc.textBetween(pluginState.suggestionPos - 1, pluginState.suggestionPos);
                  if (/\w|[\.\?!,;:]/.test(prevChar) && !text.startsWith(" ")) {
                     text = " " + text;
                  }
               }
               let tr = view.state.tr.insertText(text, pluginState.suggestionPos);
               tr = tr.setMeta(ACCEPT_SUGGESTION, true);
               tr = tr.scrollIntoView();
               view.dispatch(tr);
               return true;
            }

            if (event.key === "Escape" && (pluginState.suggestionText || pluginState.isLoading)) {
               event.preventDefault();
               view.dispatch(view.state.tr.setMeta(CLEAR_SUGGESTION, true));
               return true;
            }

            return false;
         },
         handleTextInput(view: EditorView, from: number, to: number, text: string): boolean {
            // This is the key fix: use handleTextInput instead of keydown for "++" detection
            // handleTextInput is called after the text is actually inserted, making it more reliable

            if (text === "+") {
               const { doc } = view.state;
               // Check if we now have "++" (the just-inserted "+" plus the previous character)
               if (from > 0) {
                  const prevChar = doc.textBetween(from - 1, from);
                  if (prevChar === "+") {
                     // We have "++" - remove both plus signs and trigger suggestion
                     const tr = view.state.tr.delete(from - 1, to);
                     view.dispatch(tr);

                     // Trigger suggestion after a small delay to ensure the deletion is processed
                     setTimeout(() => {
                        const { doc: newDoc, selection } = view.state;
                        const { head } = selection;

                        // Block node awareness: don't trigger suggestion if at a block node
                        const node = newDoc.nodeAt(head);
                        if (node && node.isBlock) {
                           return;
                        }

                        // Start loading suggestion
                        view.dispatch(view.state.tr.setMeta(START_SUGGESTION_LOADING, true));

                        // Get context for suggestion
                        const contextBefore = newDoc.textBetween(Math.max(0, head - contextLength), head, " ");
                        let contextAfter = "";
                        if (enableContextAfterCursor) {
                           const docSize = newDoc.content.size;
                           contextAfter = newDoc.textBetween(head, Math.min(docSize, head + contextLength), " ");
                        }

                        // Request suggestion
                        debouncedRequestSuggestion(view.state, contextBefore, contextAfter, false);
                     }, 10);

                     return true; // Prevent default text insertion
                  }
               }
            }

            return false;
         },
      },
      view(editorView) {
         // Helper function to accept suggestion
         const acceptSuggestion = () => {
            const pluginState = inlineSuggestionPluginKey.getState(editorView.state);
            if (pluginState?.suggestionText && pluginState.suggestionPos !== null) {
               let text = pluginState.suggestionText;
               if (pluginState.suggestionPos > 0) {
                  const prevChar = editorView.state.doc.textBetween(pluginState.suggestionPos - 1, pluginState.suggestionPos);
                  if (/\w|[\.\?!,;:]/.test(prevChar) && !text.startsWith(" ")) {
                     text = " " + text;
                  }
               }
               let tr = editorView.state.tr.insertText(text, pluginState.suggestionPos);
               tr = tr.setMeta(ACCEPT_SUGGESTION, true);
               tr = tr.scrollIntoView();
               editorView.dispatch(tr);
               return true;
            }
            return false;
         };

         // Set up swipe right listener on the editor DOM
         const handleSwipeRight = (_force: number, e: TouchEvent) => {
            const pluginState = inlineSuggestionPluginKey.getState(editorView.state);
            if (pluginState?.suggestionText && pluginState.suggestionPos !== null) {
               e.preventDefault();
               acceptSuggestion();
            }
         };

         // Add swipe listener to editor DOM element
         swipeListenerCleanup = addSwipeRightListener(editorView.dom as HTMLElement, handleSwipeRight);

         return {
            destroy() {
               // Clean up swipe listener when plugin is destroyed
               if (swipeListenerCleanup) {
                  swipeListenerCleanup();
                  swipeListenerCleanup = null;
               }
            },
         };
      },
   });
}

/**
 * Tiptap extension for inline suggestions with reliable "++" trigger detection.
 * Uses ProseMirror's handleTextInput for cross-browser compatibility.
 */
export const InlineSuggestionExtension = Extension.create<InlineSuggestionOptions>({
   name: "inlineSuggestion",

   addProseMirrorPlugins() {
      return [inlineSuggestionPlugin(this.options)];
   },
});
