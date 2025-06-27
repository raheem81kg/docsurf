import { Extension } from "@tiptap/core";

const TAB_CHAR = "\u0009";

const MAX_INDENT = 7;
const MIN_INDENT = 0;

const IndentHandler = Extension.create({
   name: "indentHandler",
   priority: 1000,
   addGlobalAttributes() {
      return [
         {
            types: ["listItem"],
            attributes: {
               indent: {
                  default: 0,
                  parseHTML: (element) => Number.parseInt(element.getAttribute("data-indent") || "0", 10),
                  renderHTML: (attributes) => {
                     if (!attributes.indent) return {};
                     return { "data-indent": attributes.indent };
                  },
               },
            },
         },
      ];
   },
   addKeyboardShortcuts() {
      return {
         Tab: ({ editor }) => {
            if (editor.isActive("listItem")) {
               const currentIndent = editor.getAttributes("listItem").indent || 0;
               const newIndent = Math.min(currentIndent + 1, MAX_INDENT);
               if (newIndent !== currentIndent) {
                  return editor.commands.updateAttributes("listItem", {
                     indent: newIndent,
                  });
               }
               return true;
            }
            // Insert a tab character for non-list blocks
            editor
               .chain()
               .command(({ tr }) => {
                  tr.insertText(TAB_CHAR);
                  return true;
               })
               .run();
            return true;
         },
         "Shift-Tab": ({ editor }) => {
            if (editor.isActive("listItem")) {
               const currentIndent = editor.getAttributes("listItem").indent || 0;
               const newIndent = Math.max(currentIndent - 1, MIN_INDENT);
               if (newIndent !== currentIndent) {
                  return editor.commands.updateAttributes("listItem", {
                     indent: newIndent,
                  });
               }
               // If already at indent 0, allow default liftListItem behavior (delete/outdent)
               return editor.commands.liftListItem("listItem");
            }
            // Remove a tab character for non-list blocks
            const { selection, doc } = editor.state;
            const { $from } = selection;
            const pos = $from.pos;
            if (doc.textBetween(pos - 1, pos) === TAB_CHAR) {
               editor
                  .chain()
                  .command(({ tr }) => {
                     tr.delete(pos - 1, pos);
                     return true;
                  })
                  .run();
               return true;
            }
            return true;
         },
      };
   },
});

export { IndentHandler };
