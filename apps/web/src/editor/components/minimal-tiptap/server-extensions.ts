// server-extensions.ts
// Provides the Tiptap extension set for server-side document processing.

import { StarterKit } from "@tiptap/starter-kit";
import { Typography } from "@tiptap/extension-typography";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { TaskItem } from "@tiptap/extension-task-item";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image"; // Use the base, not your custom one!
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TaskList } from "@tiptap/extension-task-list";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import { ConfirmBlockChange } from "./extensions/confirm-block-change-server";

/**
 * Returns the array of Tiptap extensions for server-side document processing.
 * Only includes extensions that are safe and compatible for server use.
 */
export function getServerTiptapExtensions() {
   return [
      StarterKit,
      TextAlign,
      Link,
      TaskList,
      TaskItem,
      Underline,
      Image, // Use the default, not your custom React one!
      Color,
      Highlight,
      TextStyle,
      Typography,
      Superscript,
      Subscript,
      HorizontalRule,
      CodeBlockLowlight,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
      Placeholder,
      ConfirmBlockChange,
   ];
}
