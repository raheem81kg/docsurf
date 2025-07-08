// MinimalTiptapReadonly.tsx
// Read-only Tiptap editor for displaying document content without toolbars, sections, or menus.

import * as React from "react";
import type { Content } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { useReadonlyTiptapEditor } from "../minimal-tiptap/hooks/use-readonly-tiptap";
import { cn } from "@docsurf/ui/lib/utils";

export interface MinimalTiptapReadonlyProps {
   value?: Content;
   className?: string;
   editorContentClassName?: string;
   editorClassName?: string;
}

export const MinimalTiptapReadonly: React.FC<MinimalTiptapReadonlyProps> = ({
   value,
   className,
   editorContentClassName,
   editorClassName,
}) => {
   const editor = useReadonlyTiptapEditor({
      value,
      editable: false,
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      editorClassName,
   });

   // Sync editor content if value changes (for public doc live updates), but only if different
   React.useEffect(() => {
      if (!editor) return;
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(value)) {
         console.log("Syncing editor content");
         editor.commands.setContent(value || "", false);
      }
   }, [editor, value]);

   if (!editor) return null;

   return (
      <div className={className}>
         <EditorContent editor={editor} className={cn("minimal-tiptap-editor min-h-full", editorContentClassName)} />
      </div>
   );
};
