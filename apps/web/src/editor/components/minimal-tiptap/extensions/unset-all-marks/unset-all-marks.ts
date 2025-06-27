import { Extension } from "@tiptap/react"

// It is used to remove the marks from the editor
export const UnsetAllMarks = Extension.create({
  addKeyboardShortcuts() {
    return {
      "Mod-\\": () => this.editor.commands.unsetAllMarks(),
    }
  },
})
