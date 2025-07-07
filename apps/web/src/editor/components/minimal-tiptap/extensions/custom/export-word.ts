/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Extension } from "@tiptap/core";
import { Packer, WidthType, type Document } from "docx";
import { DocxSerializer, defaultMarks, defaultNodes } from "prosemirror-docx";
import { ActionButton } from "../image/components/image-actions";
import { downloadFromBlob, isEmptyNode } from "../../tiptap-util";

declare module "@tiptap/react" {
   interface Commands<ReturnType> {
      exportWord: {
         exportToWord: () => ReturnType;
      };
   }
}
// export interface ExportWordOptions {}

const fallbackNodeSerializer = () => {};
const nodeSerializer = {
   ...defaultNodes,
   hardBreak: defaultNodes.hard_break ?? fallbackNodeSerializer,
   codeBlock: defaultNodes.code_block ?? fallbackNodeSerializer,
   orderedList: defaultNodes.ordered_list ?? fallbackNodeSerializer,
   listItem: defaultNodes.list_item ?? fallbackNodeSerializer,
   bulletList: defaultNodes.bullet_list ?? fallbackNodeSerializer,
   horizontalRule: defaultNodes.horizontal_rule ?? fallbackNodeSerializer,
   // Requirement Buffer on browser
   image(state: any, node: any) {
      // No image
      state.renderInline(node);
      state.closeBlock(node);
   },
   table(state: any, node: any) {
      state.table(node, {
         tableOptions: {
            width: {
               size: 100,
               type: WidthType.PERCENTAGE,
            },
         },
      });
   },
   // Custom node: confirmBlockChange
   confirmBlockChange(state: any, node: any) {
      // Export as a blockquote with the new content, or as a placeholder
      state.openNode("blockquote");
      state.writeText("[Change Block]");
      if (node.attrs && node.attrs.newContent) {
         state.writeText(node.attrs.newContent);
      } else {
         state.renderContent(node);
      }
      state.closeNode();
   },
   // Custom node: image-placeholder
   "image-placeholder": (state: any, node: any) => {
      // Export as a placeholder for image
      state.writeText("[Image Placeholder]");
      state.closeBlock(node);
   },
   // Add more custom nodes here as needed
};
const docxSerializer = /* @__PURE__ */ new DocxSerializer(nodeSerializer, defaultMarks);

export const ExportWord = /* @__PURE__ */ Extension.create({
   name: "exportWord",
   addOptions() {
      return {
         ...this.parent?.(),
         button: ({ editor, t }: any) => ({
            component: ActionButton,
            componentProps: {
               icon: "ExportWord",
               action: () => {
                  editor?.commands.exportToWord();
               },
               tooltip: t("editor.exportWord.tooltip"),
               isActive: () => false,
               disabled: false,
            },
         }),
      };
   },
   // @ts-expect-error
   addCommands() {
      return {
         exportToWord:
            () =>
            async ({ editor }) => {
               const opts: any = {
                  getImageBuffer: async (src: string) => {
                     const response = await fetch(src);
                     const arrayBuffer = await response.arrayBuffer();
                     return new Uint8Array(arrayBuffer);
                  },
               };

               // Check if the ProseMirror document is empty before exporting
               if (isEmptyNode(editor.state.doc)) {
                  if (typeof window !== "undefined") {
                     alert("Document is empty. Nothing to export.");
                  }
                  return true;
               }

               const wordDocument = docxSerializer.serialize(editor.state.doc as any, opts);
               Packer.toBlob(wordDocument).then((blob) => downloadFromBlob(blob, "export-document.docx"));
               // Packer.toBlob(wordDocument).then((blob) => downloadFromBlob(new Blob([blob]), "export-document.docx"));
               return true;
            },
      };
   },
});
