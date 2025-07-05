import type { Editor } from "@tiptap/react";
import { ImageExtension } from "@/editor/components/minimal-tiptap/extensions/custom/niazmorshed/image";
import { HorizontalRule } from "@/editor/components/minimal-tiptap/extensions";
import { Image } from "@/editor/components/minimal-tiptap/extensions";
export const isCustomNodeSelected = (editor: Editor, node: HTMLElement) => {
   const customNodes = [HorizontalRule.name, Image.name, ImageExtension.name];

   return customNodes.some((type) => editor.isActive(type));
};
