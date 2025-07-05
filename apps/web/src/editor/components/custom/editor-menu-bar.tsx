import type { Editor as EditorType } from "@tiptap/core";
import { BoldIcon } from "lucide-react";
import ToolbarButton from "../minimal-tiptap/components/toolbar-button";

// Props for the minimal menu bar
interface EditorMenuBarProps {
   editor: EditorType;
}

export const EditorMenuBar = ({ editor }: EditorMenuBarProps) => {
   if (!editor) return null;

   return (
      <div className="flex items-center gap-2">
         <ToolbarButton
            isActive={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            tooltip={"Bold (Cmd+B)"}
         >
            <BoldIcon className="w-4 h-4" />
         </ToolbarButton>
      </div>
   );
};
