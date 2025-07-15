import * as React from "react";
import type { ShouldShowProps } from "../../types";
import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react";
import { LinkEditBlock } from "../link/link-edit-block";
import { LinkPopoverBlock } from "../link/link-popover-block";

interface LinkBubbleMenuProps {
   editor: Editor;
}

interface LinkAttributes {
   href: string;
   target: string;
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor }) => {
   const [showEdit, setShowEdit] = React.useState(false);

   const editorState = useEditorState({
      editor,
      selector: ({ editor }) => {
         const { from, to } = editor.state.selection;
         const { href, target } = editor.getAttributes("link");
         const selectedText = editor.state.doc.textBetween(from, to, " ");
         return {
            href,
            target,
            selectedText,
            isActive: editor.isActive("link"),
            isEditable: editor.isEditable,
            selectionEmpty: from === to,
         };
      },
   });

   const shouldShow = React.useCallback(({ editor, from, to }: ShouldShowProps) => {
      if (from === to) {
         return false;
      }
      const { href } = editor.getAttributes("link");
      if (!editor.isActive("link") || !editor.isEditable) {
         return false;
      }
      if (href) {
         return true;
      }
      return false;
   }, []);

   const handleEdit = React.useCallback(() => {
      setShowEdit(true);
   }, []);

   const onSetLink = React.useCallback(
      (url: string, text?: string, openInNewTab?: boolean) => {
         editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .insertContent({
               type: "text",
               text: text || url,
               marks: [
                  {
                     type: "link",
                     attrs: {
                        href: url,
                        target: openInNewTab ? "_blank" : "",
                     },
                  },
               ],
            })
            .setLink({ href: url, target: openInNewTab ? "_blank" : "" })
            .run();
         setShowEdit(false);
      },
      [editor]
   );

   const onUnsetLink = React.useCallback(() => {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setShowEdit(false);
   }, [editor]);

   return (
      <BubbleMenu
         editor={editor}
         shouldShow={shouldShow}
         tippyOptions={{
            placement: "bottom-start",
            onHidden: () => setShowEdit(false),
            maxWidth: "100%",
         }}
      >
         {showEdit ? (
            <LinkEditBlock
               defaultUrl={editorState.href}
               defaultText={editorState.selectedText}
               defaultIsNewTab={editorState.target === "_blank"}
               onSave={onSetLink}
               className="w-full min-w-80 rounded-sm border bg-popover p-4 text-popover-foreground shadow-md outline-none"
            />
         ) : (
            <LinkPopoverBlock onClear={onUnsetLink} url={editorState.href} onEdit={handleEdit} />
         )}
      </BubbleMenu>
   );
};
