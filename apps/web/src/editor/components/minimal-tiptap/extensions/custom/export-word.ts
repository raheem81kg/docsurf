/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Extension } from "@tiptap/react";
import { Packer, WidthType } from "docx";
import { DocxSerializer, defaultMarks, defaultNodes } from "prosemirror-docx";
import { ActionButton } from "../image/components/image-actions";
import { downloadFromBlob } from "../../tiptap-util";

declare module "@tiptap/react" {
   interface Commands<ReturnType> {
      exportWord: {
         exportToWord: () => ReturnType;
      };
   }
}
export interface ExportWordOptions {}

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
};
const docxSerializer = /* @__PURE__ */ new DocxSerializer(nodeSerializer, defaultMarks);

export const ExportWord = /* @__PURE__ */ Extension.create<ExportWordOptions>({
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

               const wordDocument = docxSerializer.serialize(editor.state.doc as any, opts);

               Packer.toBlob(wordDocument).then((blob) => downloadFromBlob(new Blob([blob]), "export-document.docx"));

               return true;
            },
      };
   },
});
