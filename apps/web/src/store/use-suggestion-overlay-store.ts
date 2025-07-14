import { create } from "zustand";
import type { Editor } from "@tiptap/react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";

interface SuggestionOverlayState {
   isOpen: boolean;
   selectedText: string;
   position: { x: number; y: number };
   selectionRange: { from: number; to: number } | null;
   isLoading: boolean;
   setSuggestionIsLoading: (isLoading: boolean) => void;
   openSuggestionOverlay: (options: {
      position?: { x: number; y: number };
      selectedText?: string;
      from?: number;
      to?: number;
   }) => void;
   closeSuggestionOverlay: () => void;
   tryOpenSuggestionOverlayFromEditorSelection: (editor: Editor | null) => void;
   handleAcceptSuggestion: (params: {
      suggestion: string;
      docId: string | undefined;
      editor: Editor | null;
      selectionRange: { from: number; to: number } | null;
      selectedText: string;
      onClose: () => void;
   }) => void;
}

export const useSuggestionOverlayStore = create<SuggestionOverlayState>((set, get) => ({
   isOpen: false,
   selectedText: "",
   position: { x: 100, y: 100 },
   selectionRange: null,
   isLoading: false,
   setSuggestionIsLoading: (isLoading) => set({ isLoading }),
   openSuggestionOverlay: ({ selectedText, position, from, to }) => {
      if (get().isOpen) return;
      set({
         isOpen: true,
         selectedText: selectedText || "",
         position: position || { x: window.innerWidth / 2 - 200, y: window.innerHeight / 3 },
         selectionRange: typeof from === "number" && typeof to === "number" ? { from, to } : null,
      });
   },
   closeSuggestionOverlay: () => {
      set({ isOpen: false, selectedText: "", selectionRange: null });
   },
   tryOpenSuggestionOverlayFromEditorSelection: (editor) => {
      if (!editor) {
         showToast("Editor is not ready. Please wait for the editor to load.", "warning");
         return;
      }
      const { from, to, empty } = editor.state.selection;
      if (empty) {
         showToast("Highlight text in the document before using AI commands.", "warning");
         return;
      }
      const coords = editor.view.coordsAtPos(to);
      get().openSuggestionOverlay({
         position: { x: coords.left, y: coords.bottom },
         selectedText: editor.state.doc.textBetween(from, to, " "),
         from,
         to,
      });
   },
   handleAcceptSuggestion: ({ suggestion, docId, editor, selectionRange, selectedText, onClose }) => {
      if (!docId) {
         showToast("Cannot apply suggestion: No document loaded.", "error");
         return;
      }
      if (!editor) {
         showToast("Cannot apply suggestion: Editor not active.", "error");
         return;
      }
      if (selectionRange && selectedText && selectedText.trim() !== "") {
         const docSize = editor.state.doc.content.size;
         const { from, to } = selectionRange;
         if (from < 0 || to > docSize || from >= to) {
            showToast("Cannot apply suggestion: Invalid text range.", "error");
            onClose();
            return;
         }
         try {
            editor.commands.insertContentAt({ from, to }, suggestion);
            showToast("Suggestion applied", "success");
         } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[Editor apply-suggestion] Error applying suggestion:", error);
            showToast("Failed to apply suggestion.", "error");
         }
         onClose();
      } else {
         showToast("Cannot apply suggestion: No text was selected.", "warning");
      }
   },
}));
