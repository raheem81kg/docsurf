import type * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { FormatAction } from "../../types";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import type { VariantProps } from "class-variance-authority";
import { CaretDownIcon, CodeIcon, DividerHorizontalIcon, PlusIcon, QuoteIcon } from "@radix-ui/react-icons";
import { LinkEditPopover } from "../link/link-edit-popover";
import { ImageEditDialog } from "../image/image-edit-dialog";
import { ToolbarSection } from "../toolbar-section";
import TableActionButton from "../../extensions/table/components/TableActionButton";
import { Table as TableIcon } from "lucide-react";

type InsertElementAction = "codeBlock" | "blockquote" | "horizontalRule";
interface InsertElement extends FormatAction {
   value: InsertElementAction;
}

interface SectionFiveProps extends VariantProps<typeof toggleVariants> {
   editor: Editor;
   activeActions?: InsertElementAction[];
   mainActionCount?: number;
   isDocLocked?: boolean;
}

export const SectionFive: React.FC<SectionFiveProps> = ({
   editor,
   activeActions = ["codeBlock", "blockquote", "horizontalRule"],
   mainActionCount = 0,
   size,
   variant,
   isDocLocked,
}) => {
   const editorState = useEditorState({
      editor,
      selector: (context) => ({
         isCodeBlock: context.editor.isActive("codeBlock"),
         isBlockquote: context.editor.isActive("blockquote"),
      }),
   });

   const formatActionsWithActive: InsertElement[] = [
      {
         value: "codeBlock",
         label: "Code block",
         icon: <CodeIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
         isActive: () => editorState.isCodeBlock,
         canExecute: (editor) => editor.can().chain().focus().toggleCodeBlock().run(),
         shortcuts: ["mod", "alt", "C"],
      },
      {
         value: "blockquote",
         label: "Blockquote",
         icon: <QuoteIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleBlockquote().run(),
         isActive: () => editorState.isBlockquote,
         canExecute: (editor) => editor.can().chain().focus().toggleBlockquote().run(),
         shortcuts: ["mod", "shift", "B"],
      },
      {
         value: "horizontalRule",
         label: "Divider",
         icon: <DividerHorizontalIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().setHorizontalRule().run(),
         isActive: () => false,
         canExecute: (editor) => editor.can().chain().focus().setHorizontalRule().run(),
         shortcuts: ["mod", "alt", "-"],
      },
   ];

   return (
      <>
         <TableActionButton
            editor={editor}
            variant={variant}
            tooltip="Insert table"
            icon={<TableIcon className="size-4.5" />}
            disableHoverableContent={true}
            disabled={isDocLocked}
         />
         <LinkEditPopover editor={editor} size={size} variant={variant} disableHoverableContent={true} disabled={isDocLocked} />
         <ImageEditDialog editor={editor} size={size} variant={variant} disableHoverableContent={true} disabled={isDocLocked} />
         <ToolbarSection
            editor={editor}
            actions={formatActionsWithActive}
            activeActions={activeActions}
            mainActionCount={mainActionCount}
            disableHoverableContent={true}
            dropdownIcon={
               <>
                  <PlusIcon className="size-4.5" />
                  <CaretDownIcon className="size-4.5" />
               </>
            }
            dropdownTooltip="Insert elements"
            size={size}
            variant={variant}
            disabled={isDocLocked}
         />
      </>
   );
};

SectionFive.displayName = "SectionFive";

export default SectionFive;
