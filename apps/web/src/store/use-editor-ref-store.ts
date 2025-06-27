/**
 * Zustand store for sharing the Tiptap editor instance across the app.
 * Use setEditor to register the Tiptap instance and get it anywhere.
 */
import { create } from "zustand";
import type { Editor } from "@tiptap/react";

interface EditorRefState {
   editor: Editor | null;
   setEditor: (editor: Editor | null) => void;
}

export const useEditorRefStore = create<EditorRefState>((set) => ({
   editor: null,
   setEditor: (editor) => set({ editor }),
}));
