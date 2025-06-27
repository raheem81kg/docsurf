import * as React from "react";
import type { Editor } from "@tiptap/react";
import { ToolbarButton } from "../toolbar-button";
import { Redo2Icon, Undo2Icon } from "lucide-react";
import { WandSparkles } from "lucide-react";
import { Separator } from "@docsurf/ui/components/separator";
import { useSuggestionOverlay } from "@/editor/components/providers/suggestion-overlay/suggestion-overlay-provider";

/**
 * SectionZero provides Undo and Redo buttons for the editor, with tooltips and consistent UI.
 */
export interface SectionZeroProps {
   editor: Editor;
   className?: string;
   isDocLocked?: boolean;
}

export const SectionZero: React.FC<SectionZeroProps> = ({ editor, className, isDocLocked }) => {
   // Undo
   const canUndo = editor?.can().undo() ?? false;
   function handleUndo() {
      if (canUndo) editor.chain().focus().undo().run();
   }

   // Redo
   const canRedo = editor?.can().redo() ?? false;
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
      <div className={"flex items-center gap-1 " + (className ?? "")}>
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
         {/* 
         <ToolbarButton
            // onClick={handleAiButtonClick}
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
            disabled={isDocLocked}
         >
            <WandSparkles className="size-4.5 text-brand" />
         </ToolbarButton> */}
      </div>
   );
};

SectionZero.displayName = "SectionZero";

export default SectionZero;
