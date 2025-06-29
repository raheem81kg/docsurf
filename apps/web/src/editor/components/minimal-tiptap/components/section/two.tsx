import type * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { FormatAction } from "../../types";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import type { VariantProps } from "class-variance-authority";
import {
   CodeIcon,
   DotsHorizontalIcon,
   FontBoldIcon,
   FontItalicIcon,
   StrikethroughIcon,
   TextNoneIcon,
   UnderlineIcon,
} from "@radix-ui/react-icons";
import { ToolbarSection } from "../toolbar-section";

type TextStyleAction = "bold" | "italic" | "underline" | "strikethrough" | "code" | "clearFormatting" | "superscript" | "subscript";

interface TextStyle extends FormatAction {
   value: TextStyleAction;
}

interface SectionTwoProps extends VariantProps<typeof toggleVariants> {
   editor?: Editor;
   activeActions?: TextStyleAction[];
   mainActionCount?: number;
   isDocLocked?: boolean;
}

export const SectionTwo: React.FC<SectionTwoProps> = ({
   editor,
   activeActions = ["bold", "italic", "underline", "strikethrough", "code", "clearFormatting", "superscript", "subscript"],
   mainActionCount = 2,
   size,
   variant,
   isDocLocked,
}) => {
   // Log rerender
   console.log("[SectionTwo] rerender", { isDocLocked, activeActions, size, variant });
   if (!editor) return null;
   const editorState = useEditorState({
      editor,
      selector: (context) => ({
         isCodeBlock: context.editor.isActive("codeBlock"),
         isBold: context.editor.isActive("bold"),
         isItalic: context.editor.isActive("italic"),
         isUnderline: context.editor.isActive("underline"),
         isStrike: context.editor.isActive("strike"),
         isCode: context.editor.isActive("code"),
         isSuperscript: context.editor.isActive("superscript"),
         isSubscript: context.editor.isActive("subscript"),
      }),
   });

   const formatActionsWithActive: TextStyle[] = [
      {
         value: "bold",
         label: "Bold",
         icon: <FontBoldIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleBold().run(),
         isActive: () => editorState.isBold,
         canExecute: (editor) => editor.can().chain().focus().toggleBold().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "B"],
      },
      {
         value: "italic",
         label: "Italic",
         icon: <FontItalicIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleItalic().run(),
         isActive: () => editorState.isItalic,
         canExecute: (editor) => editor.can().chain().focus().toggleItalic().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "I"],
      },
      {
         value: "underline",
         label: "Underline",
         icon: <UnderlineIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleUnderline().run(),
         isActive: () => editorState.isUnderline,
         canExecute: (editor) => editor.can().chain().focus().toggleUnderline().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "U"],
      },
      {
         value: "strikethrough",
         label: "Strikethrough",
         icon: <StrikethroughIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleStrike().run(),
         isActive: () => editorState.isStrike,
         canExecute: (editor) => editor.can().chain().focus().toggleStrike().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "shift", "S"],
      },
      {
         value: "code",
         label: "Code",
         icon: <CodeIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleCode().run(),
         isActive: () => editorState.isCode,
         canExecute: (editor) => editor.can().chain().focus().toggleCode().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "E"],
      },
      {
         value: "clearFormatting",
         label: "Clear formatting",
         icon: <TextNoneIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().unsetAllMarks().run(),
         isActive: () => false,
         canExecute: (editor) => editor.can().chain().focus().unsetAllMarks().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "\\"],
      },
      {
         value: "superscript",
         label: "Superscript",
         icon: <CodeIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleSuperscript().run(),
         isActive: () => editorState.isSuperscript,
         canExecute: (editor) => editor.can().chain().focus().toggleSuperscript().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "."],
      },
      {
         value: "subscript",
         label: "Subscript",
         icon: <CodeIcon className="size-4.5" />,
         action: (editor) => editor.chain().focus().toggleSubscript().run(),
         isActive: () => editorState.isSubscript,
         canExecute: (editor) => editor.can().chain().focus().toggleSubscript().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", ","],
      },
   ];

   return (
      <ToolbarSection
         editor={editor}
         actions={formatActionsWithActive}
         activeActions={activeActions}
         mainActionCount={mainActionCount}
         dropdownIcon={<DotsHorizontalIcon className="size-4.5" />}
         dropdownTooltip="More formatting"
         dropdownClassName="w-8"
         size={size}
         variant={variant}
         disableHoverableContent
         disabled={editorState.isCodeBlock || isDocLocked}
      />
   );
};

SectionTwo.displayName = "SectionTwo";

export default SectionTwo;
