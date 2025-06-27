// import type * as React from "react";
// import type { Editor } from "@tiptap/react";
// import type { FormatAction } from "../../types";
// import type { toggleVariants } from "@docsurf/ui/components/toggle";
// import type { VariantProps } from "class-variance-authority";
// import {
//    CodeIcon,
//    DotsHorizontalIcon,
//    FontBoldIcon,
//    FontItalicIcon,
//    StrikethroughIcon,
//    TextNoneIcon,
//    UnderlineIcon,
// } from "@radix-ui/react-icons";
// import { ToolbarSection } from "../toolbar-section";

// type TextStyleAction = "bold" | "italic" | "underline" | "strikethrough" | "code" | "clearFormatting" | "superscript" | "subscript";

// interface TextStyle extends FormatAction {
//    value: TextStyleAction;
// }

// const formatActions: TextStyle[] = [
//    {
//       value: "bold",
//       label: "Bold",
//       icon: <FontBoldIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().toggleBold().run(),
//       isActive: (editor) => editor.isActive("bold"),
//       canExecute: (editor) => editor.can().chain().focus().toggleBold().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", "B"],
//    },
//    {
//       value: "italic",
//       label: "Italic",
//       icon: <FontItalicIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().toggleItalic().run(),
//       isActive: (editor) => editor.isActive("italic"),
//       canExecute: (editor) => editor.can().chain().focus().toggleItalic().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", "I"],
//    },
//    {
//       value: "underline",
//       label: "Underline",
//       icon: <UnderlineIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().toggleUnderline().run(),
//       isActive: (editor) => editor.isActive("underline"),
//       canExecute: (editor) => editor.can().chain().focus().toggleUnderline().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", "U"],
//    },
//    {
//       value: "strikethrough",
//       label: "Strikethrough",
//       icon: <StrikethroughIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().toggleStrike().run(),
//       isActive: (editor) => editor.isActive("strike"),
//       canExecute: (editor) => editor.can().chain().focus().toggleStrike().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", "shift", "S"],
//    },
//    {
//       value: "code",
//       label: "Code",
//       icon: <CodeIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().toggleCode().run(),
//       isActive: (editor) => editor.isActive("code"),
//       canExecute: (editor) => editor.can().chain().focus().toggleCode().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", "E"],
//    },
//    {
//       value: "clearFormatting",
//       label: "Clear formatting",
//       icon: <TextNoneIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().unsetAllMarks().run(),
//       isActive: () => false,
//       canExecute: (editor) => editor.can().chain().focus().unsetAllMarks().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", "\\"],
//    },
//    {
//       value: "superscript",
//       label: "Superscript",
//       // TODO: Replace with a more appropriate icon if available
//       icon: <CodeIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().toggleSuperscript().run(),
//       isActive: (editor) => editor.isActive("superscript"),
//       canExecute: (editor) => editor.can().chain().focus().toggleSuperscript().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", "."],
//    },
//    {
//       value: "subscript",
//       label: "Subscript",
//       // TODO: Replace with a more appropriate icon if available
//       icon: <CodeIcon className="size-4.5" />,
//       action: (editor) => editor.chain().focus().toggleSubscript().run(),
//       isActive: (editor) => editor.isActive("subscript"),
//       canExecute: (editor) => editor.can().chain().focus().toggleSubscript().run() && !editor.isActive("codeBlock"),
//       shortcuts: ["mod", ","],
//    },
// ];

// interface SectionTwoProps extends VariantProps<typeof toggleVariants> {
//    editor: Editor;
//    activeActions?: TextStyleAction[];
//    mainActionCount?: number;
//    isDocLocked?: boolean;
// }

// export const SectionTwo: React.FC<SectionTwoProps> = ({
//    editor,
//    activeActions = formatActions.map((action) => action.value),
//    mainActionCount = 2,
//    size,
//    variant,
//    isDocLocked,
// }) => {
//    return (
//       <ToolbarSection
//          editor={editor}
//          actions={formatActions}
//          activeActions={activeActions}
//          mainActionCount={mainActionCount}
//          dropdownIcon={<DotsHorizontalIcon className="size-4.5" />}
//          dropdownTooltip="More formatting"
//          dropdownClassName="w-8"
//          size={size}
//          variant={variant}
//          disableHoverableContent
//          disabled={isDocLocked}
//       />
//    );
// };

// SectionTwo.displayName = "SectionTwo";

// export default SectionTwo;
