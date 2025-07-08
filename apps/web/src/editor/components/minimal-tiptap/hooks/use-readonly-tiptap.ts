// use-readonly-tiptap.ts
// Minimal hook for initializing a read-only Tiptap editor for public document display.

import type { Content, UseEditorOptions } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Link } from "../extensions";
import { cn } from "@docsurf/ui/lib/utils";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { Typography } from "@tiptap/extension-typography";
import { Mathematics } from "@tiptap/extension-mathematics";
import { Image, HorizontalRule, CodeBlockLowlight, Selection, Color, FileHandler } from "../extensions";
import { IndentHandler, TrailingNode } from "../extensions/custom";
import { ImagePlaceholder } from "../extensions/custom/niazmorshed/image-placeholder";
import { Table } from "../extensions/table";

/**
 * useReadonlyTiptapEditor
 *
 * Initializes a minimal, read-only Tiptap editor instance for rendering document content.
 * Includes all extensions needed for full document rendering (tables, images, math, etc.).
 * Excludes collaborative, saving, and suggestion extensions for performance and security.
 *
 * @param value - The content to display (Tiptap JSON or HTML)
 * @param placeholder - Placeholder text for empty content
 * @param editorClassName - Optional className for the editor
 * @returns Tiptap Editor instance
 */
export interface UseReadonlyTiptapEditorProps extends Partial<UseEditorOptions> {
   value?: Content;
   placeholder?: string;
   editorClassName?: string;
}

export function useReadonlyTiptapEditor({ value, placeholder = "", editorClassName, ...props }: UseReadonlyTiptapEditorProps) {
   const editor = useEditor({
      extensions: [
         IndentHandler,
         StarterKit.configure({
            horizontalRule: false,
            codeBlock: false,
            paragraph: { HTMLAttributes: { class: "text-node" } },
            heading: { HTMLAttributes: { class: "heading-node" } },
            blockquote: { HTMLAttributes: { class: "block-node" } },
            bulletList: { HTMLAttributes: { class: "list-node" } },
            orderedList: { HTMLAttributes: { class: "list-node" } },
            code: { HTMLAttributes: { class: "inline", spellcheck: "false" } },
            dropcursor: { width: 2, class: "ProseMirror-dropcursor border" },
         }),
         TextAlign.configure({ types: ["heading", "paragraph"] }),
         Link,
         TrailingNode,
         TaskList,
         TaskItem.configure({ nested: true }),
         Underline,
         Mathematics,
         ImagePlaceholder,
         Image,
         FileHandler,
         Color,
         Highlight.configure({ multicolor: true }),
         TextStyle,
         Selection,
         Typography,
         Superscript,
         Subscript,
         HorizontalRule,
         CodeBlockLowlight,
         Placeholder.configure({
            placeholder: () => placeholder,
            showOnlyCurrent: true,
            includeChildren: false,
         }),
         Table,
      ],
      content: value,
      editable: false,
      editorProps: {
         attributes: {
            class: cn("min-h-full flex-1 focus:outline-none", editorClassName),
         },
      },
      ...props,
   });
   return editor;
}
