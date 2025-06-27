/**
 * Tiptap extension for highlighting and managing a "selection context" (e.g., for AI suggestions).
 * Provides visual feedback and state for a selected text range, with loading state support.
 *
 * - Use commands to activate/deactivate the context and set loading state.
 * - Exposes plugin key and transaction meta constants for integration.
 */
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, EditorState, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * State for the selection context plugin.
 */
export interface SelectionContextState {
   isActive: boolean;
   isLoading: boolean;
   from: number | null;
   to: number | null;
}

/**
 * Plugin key for accessing selection context state.
 */
export const selectionContextPluginKey = new PluginKey<SelectionContextState>("selectionContext");

/**
 * Initial state for the selection context.
 */
const initialState: SelectionContextState = {
   isActive: false,
   isLoading: false,
   from: null,
   to: null,
};

// Transaction metadata types
export const ACTIVATE_SUGGESTION_CONTEXT = "activateSuggestionContext";
export const DEACTIVATE_SUGGESTION_CONTEXT = "deactivateSuggestionContext";
export const SET_SUGGESTION_LOADING_STATE = "setSuggestionLoadingState";

/**
 * ProseMirror plugin for selection context highlighting and state.
 */
export function selectionContextPlugin(): Plugin<SelectionContextState> {
   return new Plugin<SelectionContextState>({
      key: selectionContextPluginKey,
      state: {
         init(): SelectionContextState {
            return initialState;
         },
         apply(
            tr: Transaction,
            pluginState: SelectionContextState,
            _oldState: EditorState,
            newState: EditorState
         ): SelectionContextState {
            const activateMeta = tr.getMeta(ACTIVATE_SUGGESTION_CONTEXT);
            if (activateMeta) {
               const { from, to } = activateMeta as { from: number; to: number };
               if (newState.selection.from >= from && newState.selection.to <= to) {
                  return { ...initialState, isActive: true, from, to };
               }
               return initialState;
            }

            const deactivateMeta = tr.getMeta(DEACTIVATE_SUGGESTION_CONTEXT);
            if (deactivateMeta) {
               return initialState;
            }

            const loadingMeta = tr.getMeta(SET_SUGGESTION_LOADING_STATE);
            if (loadingMeta !== undefined && pluginState.isActive) {
               return { ...pluginState, isLoading: !!loadingMeta };
            }

            // Deactivate if doc changed and mapping collapses the range
            if (pluginState.isActive && pluginState.from !== null && pluginState.to !== null) {
               if (tr.docChanged) {
                  try {
                     const newFrom = tr.mapping.map(pluginState.from);
                     const newTo = tr.mapping.map(pluginState.to);
                     if (newFrom === newTo) return initialState;
                  } catch (e) {
                     return initialState;
                  }
               }
            }

            return pluginState;
         },
      },
      props: {
         decorations(state: EditorState): DecorationSet | null {
            const pluginState = selectionContextPluginKey.getState(state);
            if (!pluginState?.isActive || pluginState.from === null || pluginState.to === null) {
               return null;
            }

            const decorationClass = pluginState.isLoading ? "suggestion-context-loading" : "suggestion-context-highlight";

            const maxPos = state.doc.content.size;
            const from = Math.min(pluginState.from, maxPos);
            const to = Math.min(pluginState.to, maxPos);

            if (from >= to) return null;

            const decoration = Decoration.inline(from, to, { class: decorationClass }, { inclusiveStart: false, inclusiveEnd: false });
            return DecorationSet.create(state.doc, [decoration]);
         },
      },
   });
}

/**
 * Tiptap extension wrapping the selection context plugin.
 *
 * Usage:
 *   - Use commands to activate/deactivate context and set loading state.
 *   - Access state via plugin key.
 */
export const SelectionContextExtension = Extension.create({
   name: "selectionContext",
   addProseMirrorPlugins() {
      return [selectionContextPlugin()];
   },
   addCommands() {
      return {
         activateSelectionContext:
            (from: number, to: number) =>
            ({
               tr,
               dispatch,
            }: {
               tr: import("@tiptap/pm/state").Transaction;
               dispatch?: (tr: import("@tiptap/pm/state").Transaction) => void;
            }) => {
               if (dispatch) {
                  dispatch(tr.setMeta(ACTIVATE_SUGGESTION_CONTEXT, { from, to }));
               }
               return true;
            },
         deactivateSelectionContext:
            () =>
            ({
               tr,
               dispatch,
            }: {
               tr: import("@tiptap/pm/state").Transaction;
               dispatch?: (tr: import("@tiptap/pm/state").Transaction) => void;
            }) => {
               if (dispatch) {
                  dispatch(tr.setMeta(DEACTIVATE_SUGGESTION_CONTEXT, true));
               }
               return true;
            },
         setSelectionContextLoading:
            (isLoading: boolean) =>
            ({
               tr,
               dispatch,
            }: {
               tr: import("@tiptap/pm/state").Transaction;
               dispatch?: (tr: import("@tiptap/pm/state").Transaction) => void;
            }) => {
               if (dispatch) {
                  dispatch(tr.setMeta(SET_SUGGESTION_LOADING_STATE, isLoading));
               }
               return true;
            },
      } as Partial<import("@tiptap/core").RawCommands>;
   },
});

export default SelectionContextExtension;
