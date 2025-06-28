import { Node, mergeAttributes } from "@tiptap/react";

export const ConfirmBlockChange = Node.create({
   name: "confirmBlockChange",
   group: "block",
   atom: false,
   inline: false,
   selectable: false,
   draggable: false,
   marks: "",
   allowGapCursor: true,
   addAttributes() {
      return {
         changeType: { default: "replace" },
         originalContent: { default: "" },
         newContent: { default: "" },
         blockId: { default: "" },
      };
   },
   parseHTML() {
      return [{ tag: "confirm-block-change" }];
   },
   renderHTML({ HTMLAttributes }) {
      return ["confirm-block-change", mergeAttributes(HTMLAttributes)];
   },
});
