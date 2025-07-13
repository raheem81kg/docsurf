"use client";

import { createContext, useContext, type ReactNode, useState, useCallback, useEffect } from "react";
import SuggestionOverlay from "./suggestion-overlay";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { useEditorRefStore } from "@/store/use-editor-ref-store";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useConvexTree } from "@/components/sandbox/left/_tree_components/use-convex-tree";

interface SuggestionOverlayContextType {
   openSuggestionOverlay: (options: {
      position?: { x: number; y: number };
      selectedText?: string;
      from?: number;
      to?: number;
   }) => void;
   closeSuggestionOverlay: () => void;
   setSuggestionIsLoading: (isLoading: boolean) => void;
   isOpen: boolean;
   tryOpenSuggestionOverlayFromEditorSelection: () => void;
}

const SuggestionOverlayContext = createContext<SuggestionOverlayContextType | null>(null);

export function SuggestionOverlayProvider({ children }: { children: ReactNode }) {
   const [isOpen, setIsOpen] = useState(false);
   const [selectedText, setSelectedText] = useState("");
   const [position, setPosition] = useState({ x: 100, y: 100 });
   const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
   // Get user and workspaceId
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;
   const { doc } = useCurrentDocument(user);
   const { isLoading: isTreeLoading } = useConvexTree({
      workspaceId: workspaceId,
   });
   const editor = useEditorRefStore((state) => state.editor);

   const setSuggestionIsLoading = useCallback((isLoading: boolean) => {}, []);

   useEffect(() => {
      if (!editor) return;

      const handler = () => {
         const { from, to, empty } = editor.state.selection;
         if (!empty) {
            setSelectionRange({ from, to });
            setSelectedText(editor.state.doc.textBetween(from, to, " "));
         } else {
            setSelectionRange(null);
            setSelectedText("");
         }
      };
      editor.on("selectionUpdate", handler);
      return () => {
         editor.off("selectionUpdate", handler);
      };
   }, [editor]);

   const openSuggestionOverlay = useCallback(
      ({
         selectedText,
         position,
         from,
         to,
      }: {
         selectedText?: string;
         position?: { x: number; y: number };
         from?: number;
         to?: number;
      }) => {
         if (isOpen) return;
         if (typeof from === "number" && typeof to === "number") {
            setSelectionRange({ from, to });
         } else {
            setSelectionRange(null);
         }
         if (selectedText) {
            setSelectedText(selectedText);
         } else {
            setSelectedText("");
         }
         if (position) {
            setPosition(position);
         } else {
            setPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 3 });
         }
         setIsOpen(true);
      },
      [isOpen]
   );

   const closeSuggestionOverlay = useCallback(() => {
      setIsOpen(false);
      setSelectedText("");
      setSelectionRange(null);
   }, []);

   const handleAcceptSuggestion = useCallback(
      (suggestion: string) => {
         if (!doc?._id) {
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
               closeSuggestionOverlay();
               return;
            }
            try {
               editor.commands.insertContentAt({ from, to }, suggestion);
               showToast("Suggestion applied", "success");
            } catch (error) {
               console.error("[Editor apply-suggestion] Error applying suggestion:", error);
               showToast("Failed to apply suggestion.", "error");
            }
            closeSuggestionOverlay();
         } else {
            showToast("Cannot apply suggestion: No text was selected.", "warning");
         }
      },
      [doc?._id, selectedText, closeSuggestionOverlay, editor, selectionRange]
   );

   const tryOpenSuggestionOverlayFromEditorSelection = useCallback(() => {
      if (!editor) {
         showToast("Editor is not ready. Please wait for the editor to load.", "warning");
         return;
      }
      const { from, to, empty } = editor.state.selection;
      if (empty) {
         showToast("Select text in the document before using AI commands.", "warning");
         return;
      }
      const coords = editor.view.coordsAtPos(to);
      openSuggestionOverlay({
         position: { x: coords.left, y: coords.bottom },
         selectedText: editor.state.doc.textBetween(from, to, " "),
         from,
         to,
      });
   }, [editor, openSuggestionOverlay]);

   useEffect(() => {
      const handleCommandK = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key === "j") {
            e.preventDefault();
            tryOpenSuggestionOverlayFromEditorSelection();
         }
      };
      window.addEventListener("keydown", handleCommandK);
      return () => window.removeEventListener("keydown", handleCommandK);
   }, [tryOpenSuggestionOverlayFromEditorSelection]);

   useEffect(() => {
      if (!isOpen) return;
      if (!doc?._id) {
         setIsOpen(false);
         setSelectedText("");
         setSelectionRange(null);
         return;
      }
      if (selectionRange === null) {
         setIsOpen(false);
         setSelectedText("");
         setSelectionRange(null);
         return;
      }
      if (editor) {
         const onUpdate = () => {
            setIsOpen(false);
            setSelectedText("");
            setSelectionRange(null);
         };
         editor.on("update", onUpdate);
         return () => {
            editor.off("update", onUpdate);
         };
      }
   }, [doc?._id, selectionRange, isOpen, editor]);

   return (
      <SuggestionOverlayContext.Provider
         value={{
            openSuggestionOverlay,
            closeSuggestionOverlay,
            setSuggestionIsLoading,
            isOpen,
            tryOpenSuggestionOverlayFromEditorSelection,
         }}
      >
         {children}
         {doc?._id && !isTreeLoading && (
            <SuggestionOverlay
               documentId={doc._id}
               workspaceId={workspaceId ?? ""}
               isOpen={isOpen}
               onClose={closeSuggestionOverlay}
               selectedText={selectedText}
               position={position}
               onAcceptSuggestion={handleAcceptSuggestion}
               editor={editor}
               from={selectionRange?.from}
               to={selectionRange?.to}
               userId={user?._id}
            />
         )}
      </SuggestionOverlayContext.Provider>
   );
}

export function useSuggestionOverlay() {
   const context = useContext(SuggestionOverlayContext);
   if (!context) {
      throw new Error("useSuggestionOverlay must be used within a SuggestionOverlayProvider");
   }
   return context;
}
