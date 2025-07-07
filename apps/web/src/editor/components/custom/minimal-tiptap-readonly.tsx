// MinimalTiptapReadonly.tsx
// Read-only Tiptap editor for displaying document content without toolbars, sections, or menus.

import * as React from "react";
import type { Content } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { useMinimalTiptapEditor } from "../minimal-tiptap/hooks/use-minimal-tiptap";

export interface MinimalTiptapReadonlyProps {
   value?: Content;
   className?: string;
   editorContentClassName?: string;
}

export const MinimalTiptapReadonly: React.FC<MinimalTiptapReadonlyProps> = ({ value, className, editorContentClassName }) => {
   const editor = useMinimalTiptapEditor({
      value,
      editable: false,
      enableVersionTracking: false,
      shouldRerenderOnTransaction: false,
      immediatelyRender: true,
      registerInStore: false,
      isMainEditor: false,
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
         <EditorContent editor={editor} className={editorContentClassName} />
      </div>
   );
};
