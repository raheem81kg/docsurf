/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Extension } from "@tiptap/core";
import { Packer, WidthType, type Document } from "docx";
import { DocxSerializer, defaultMarks, defaultNodes } from "prosemirror-docx";
import { ActionButton } from "../image/components/image-actions";
import { downloadFromBlob } from "../../tiptap-util";

declare module "@tiptap/react" {
   interface Commands<ReturnType> {
      exportWord: {
         exportToWord: (filename?: string) => ReturnType;
      };
   }
}
// export interface ExportWordOptions {}

const nodeSerializer = {
   ...defaultNodes,
   hardBreak: defaultNodes.hard_break,
   codeBlock: defaultNodes.code_block,
   orderedList: defaultNodes.ordered_list,
   listItem: defaultNodes.list_item,
   bulletList: defaultNodes.bullet_list,
   horizontalRule: defaultNodes.horizontal_rule,
   mathematic: defaultNodes.math,
   subscript: defaultNodes.sub,
   superscript: defaultNodes.sup,
   code: defaultNodes.code,
   codeHighlight: defaultNodes.code_highlight,
   codeInline: defaultNodes.code_inline,
   image(state: any, node: any) {
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
   // Fallback for unknown nodes
   fallback(state: any, node: any) {
      // eslint-disable-next-line no-console
      console.warn("Unserialized node:", node.type?.name, node);
      state.renderContent(node);
      state.closeBlock(node);
   },
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
            (filename?: string) =>
            async ({ editor }) => {
               const opts: any = {
                  getImageBuffer: async (src: string) => {
                     const response = await fetch(src);
                     const arrayBuffer = await response.arrayBuffer();
                     return new Uint8Array(arrayBuffer);
                  },
               };

               // Log the document and serialization output for debugging
               // eslint-disable-next-line no-console
               console.log("editor.state.doc", editor.state.doc);
               const wordDocument = docxSerializer.serialize(editor.state.doc as any, opts);
               // eslint-disable-next-line no-console
               console.log("wordDocument", wordDocument);
               // Additional logging for body and body.root
               // @ts-ignore
               console.log("wordDocument.body", wordDocument.body);
               // @ts-ignore
               console.log("wordDocument.body.root", wordDocument.body?.root);

               const safeFilename = filename && typeof filename === "string" && filename.trim() ? filename : "export-document.docx";
               Packer.toBlob(wordDocument).then((blob) => downloadFromBlob(blob, safeFilename));
               return true;
            },
      };
   },
});
