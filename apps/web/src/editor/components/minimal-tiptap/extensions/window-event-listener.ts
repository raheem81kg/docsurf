/**
 * Tiptap extension for listening to arbitrary window events and handling them with custom logic.
 * Usage:
 *   WindowEventListener.configure({
 *     listeners: {
 *       'editor:block-edit': (event, editor) => { ... },
 *       'editor:stream-text': (event, editor) => { ... },
 *     }
 *   })
 */
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export interface WindowEventListenerConfig {
   listeners: {
      [eventName: string]: (event: Event, editor: Editor) => void;
   };
}

export const WindowEventListener = Extension.create<WindowEventListenerConfig>({
   name: "windowEventListener",
   addProseMirrorPlugins() {
      const listeners = this.options.listeners || {};
      return [
         new Plugin({
            view: (editorView: any) => {
               const editor = this.editor;
               const handlerMap: { [eventName: string]: EventListener } = {};
               Object.entries(listeners).forEach(([eventName, handler]) => {
                  const boundHandler = (event: Event) => handler(event, editor);
                  handlerMap[eventName] = boundHandler;
                  window.addEventListener(eventName, boundHandler);
               });
               return {
                  destroy() {
                     Object.entries(handlerMap).forEach(([eventName, boundHandler]) => {
                        window.removeEventListener(eventName, boundHandler);
                     });
                  },
               };
            },
         }),
      ];
   },
});
