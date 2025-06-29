import type * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { ToolbarButton } from "../toolbar-button";
import { Redo2Icon, Undo2Icon } from "lucide-react";
import { WandSparkles } from "lucide-react";
import { Separator } from "@docsurf/ui/components/separator";
import { useSuggestionOverlay } from "@/editor/components/providers/suggestion-overlay/suggestion-overlay-provider";
import { cn } from "@docsurf/ui/lib/utils";

/**
 * SectionZero provides Undo and Redo buttons for the editor, with tooltips and consistent UI.
 */
export interface SectionZeroProps {
   editor: Editor;
   className?: string;
   isDocLocked?: boolean;
}

export const SectionZero: React.FC<SectionZeroProps> = ({ editor, className, isDocLocked }) => {
   const editorState = useEditorState({
      editor,
      // This function will be called every time the editor state changes
      selector: ({ editor }: { editor: Editor }) => ({
         // It will only re-render if the bold or italic state changes
         canUndo: editor.can().undo(),
         canRedo: editor.can().redo(),
      }),
   });
   // Undo
   const canUndo = editorState.canUndo ?? false;
   function handleUndo() {
      if (canUndo) editor.chain().focus().undo().run();
   }

   // Redo
   const canRedo = editorState.canRedo ?? false;
   function handleRedo() {
      if (canRedo) editor.chain().focus().redo().run();
   }

   // Suggestion overlay logic
   const { isOpen, closeSuggestionOverlay, tryOpenSuggestionOverlayFromEditorSelection } = useSuggestionOverlay();
   function handleAiButtonClick() {
      if (isOpen) {
         closeSuggestionOverlay();
      } else {
         tryOpenSuggestionOverlayFromEditorSelection();
      }
   }

   return (
      <div className={cn("flex items-center gap-1 ", className)}>
         <ToolbarButton
            onClick={handleUndo}
            disabled={!canUndo || isDocLocked}
            tooltip="Undo (Ctrl+Z)"
            aria-label="Undo"
            size="sm"
            variant="outline"
            disableHoverableContent
         >
            <Undo2Icon className="size-4" />
         </ToolbarButton>
         <ToolbarButton
            onClick={handleRedo}
            disabled={!canRedo || isDocLocked}
            tooltip="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
            size="sm"
            variant="outline"
            disableHoverableContent
         >
            <Redo2Icon className="size-4" />
         </ToolbarButton>

         <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />

         <ToolbarButton
            onMouseDown={(e) => {
               e.preventDefault();
               handleAiButtonClick();
            }}
            tooltip="AI Commands"
            aria-label="AI Commands"
            size="sm"
            variant="outline"
            isActive={isOpen}
            disableHoverableContent
            disabled={isDocLocked || !editor}
         >
            <WandSparkles className="size-4.5" />
         </ToolbarButton>
      </div>
   );
};

SectionZero.displayName = "SectionZero";

export default SectionZero;
