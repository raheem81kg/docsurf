/**
 * Custom hook for initializing a minimal Tiptap editor with all core and custom extensions.
 * Integrates inline suggestion extension with access to the latest editor and doc from useDocStore.
 *
 * TODO: If editor state is not reactive, audit custom extensions in createExtensions. Try with only core extensions (StarterKit, Placeholder, etc.) to isolate issues.
 */
"use client";
import * as React from "react";
import type { Editor } from "@tiptap/react";
import type { Content, UseEditorOptions } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEditor } from "@tiptap/react";
import { Typography } from "@tiptap/extension-typography";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { TaskItem } from "@tiptap/extension-task-item";
import { Highlight } from "@tiptap/extension-highlight";
import {
   Link,
   Image,
   HorizontalRule,
   CodeBlockLowlight,
   Selection,
   Color,
   UnsetAllMarks,
   ResetMarksOnEnter,
   FileHandler,
} from "../extensions";
import { cn } from "@docsurf/ui/lib/utils";
import { getOutput, randomId } from "../utils";
import { useThrottle } from "./use-throttle";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { MAX_CHARACTERS, MAX_FILE_SIZE, convertFileToBase64 } from "../tiptap-util";
import { IndentHandler, TrailingNode } from "../extensions/custom";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TaskList } from "@tiptap/extension-task-list";
// import ConfirmBlockChange from "../extensions/confirm-block-change";
import CharacterCount from "@tiptap/extension-character-count";
import { ExportWord } from "../extensions/custom/export-word";
import { ImportWord } from "../extensions/custom/import-word";
import { Table } from "../extensions/table";
import { InlineSuggestionExtension } from "../extensions/custom/inline-suggestion/inline-suggestion-plugin";
import { createRequestInlineSuggestionCallback } from "../extensions/custom/inline-suggestion/request-inline-suggestion-callback";
// import { useDocStore } from "@/store/use-doc-store";
// import { SaveExtension } from "../extensions/custom/save-extension";
import { WindowEventListener } from "../extensions/window-event-listener";
import { getBlockBasedState, type EditWithContent } from "../edit-utils";
import { useEditorRefStore } from "@/store/use-editor-ref-store";
// import { VersionTracker } from "../extensions/custom/version-tracker";
import { applySingleEditToEditor } from "../extensions/apply-edit";
import { env } from "@/env";

export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
   value?: Content;
   output?: "html" | "json" | "text";
   placeholder?: string;
   editorClassName?: string;
   throttleDelay?: number;
   onUpdate?: (content: Content) => void;
   onBlur?: (content: Content) => void;
   /**
    * Maximum number of characters allowed in the editor. Default: MAX_CHARACTERS.
    */
   characterLimit?: number;
   /**
    * Names of extensions to exclude for this editor instance.
    */
   excludeExtensions?: string[];
   /**
    * Whether to register this editor in the global editor ref store. No default, because this can break the editorref store.
    */
   registerInStore: boolean;
   /**
    * Whether to enable version tracking. Default: false.
    */
   enableVersionTracking?: boolean;
   /**
    * Configuration options for version tracking.
    */
   versionTrackingOptions?: {
      saveInterval?: number;
      idleInterval?: number;
      minCharacterChanges?: number;
      significantChanges?: number;
      saveOnBlur?: boolean;
      saveOnSignificantChange?: boolean;
      debounceMs?: number;
   };
}

const useLatest = <T>(value: T) => {
   const ref = React.useRef(value);
   React.useEffect(() => {
      ref.current = value;
   }, [value]);
   return ref;
};

const createExtensions = (
   placeholder: string,
   characterLimit: number,
   getEditor: () => Editor | null,
   getDoc: () => any,
   abortControllerRef: React.RefObject<AbortController | null>,
   getUpdateDocAsync: () => (uuid: string, doc: any) => Promise<void>,
   excludeExtensions: string[] = [],
   enableVersionTracking = false,
   versionTrackingOptions = {}
) => {
   // TODO: For debugging, comment out custom extensions below and test with only core extensions if state is not reactive.
   const allExtensions = [
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
      Image.configure({
         allowedMimeTypes: ["image/*"],
         maxFileSize: MAX_FILE_SIZE,
         allowBase64: true,
         uploadFn: async (file) => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const abortController = new AbortController();
            const src = await convertFileToBase64(file, abortController.signal);
            return { id: randomId(), src };
         },
         onToggle(editor, files, pos) {
            editor.commands.insertContentAt(
               pos,
               files.map((image) => {
                  const blobUrl = URL.createObjectURL(image);
                  const id = randomId();
                  return {
                     type: "image",
                     attrs: {
                        id,
                        src: blobUrl,
                        alt: image.name,
                        title: image.name,
                        fileName: image.name,
                     },
                  };
               })
            );
         },
         onImageRemoved({ id, src }) {
            console.log("Image removed", { id, src });
         },
         onValidationError(errors) {
            errors.forEach((error) => {
               showToast("Image validation error", "error", {
                  position: "bottom-right",
                  description: error.reason,
               });
            });
         },
         onActionSuccess({ action }) {
            const mapping = {
               copyImage: "Copy Image",
               copyLink: "Copy Link",
               download: "Download",
            };
            showToast(mapping[action], "success", {
               position: "bottom-right",
               description: "Image action success",
            });
         },
         onActionError(error, { action }) {
            const mapping = {
               copyImage: "Copy Image",
               copyLink: "Copy Link",
               download: "Download",
            };
            showToast(`Failed to ${mapping[action]}`, "error", {
               position: "bottom-right",
               description: error.message,
            });
         },
      }),
      FileHandler.configure({
         allowBase64: true,
         allowedMimeTypes: ["image/*"],
         maxFileSize: MAX_FILE_SIZE,
         onDrop: (editor, files, pos) => {
            files.forEach(async (file) => {
               const abortController = new AbortController();
               const src = await convertFileToBase64(file, abortController.signal);
               editor.commands.insertContentAt(pos, {
                  type: "image",
                  attrs: { src },
               });
            });
         },
         onPaste: (editor, files) => {
            files.forEach(async (file) => {
               const abortController = new AbortController();
               const src = await convertFileToBase64(file, abortController.signal);
               editor.commands.insertContent({
                  type: "image",
                  attrs: { src },
               });
            });
         },
         onValidationError: (errors) => {
            errors.forEach((error) => {
               showToast("Image validation error", "error", {
                  position: "bottom-right",
                  description: error.reason,
               });
            });
         },
      }),
      Color,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Selection,
      // Typography,
      // Superscript,
      // Subscript,
      UnsetAllMarks,
      HorizontalRule,
      ResetMarksOnEnter,
      CodeBlockLowlight,
      Placeholder.configure({ placeholder: () => placeholder }),
      Table,
      // ConfirmBlockChange,
      CharacterCount.configure({ limit: characterLimit }),
      // ExportWord,
      // ImportWord.configure({
      //    upload: (files: File[]) => {
      //       const f = files.map((file) => ({
      //          src: URL.createObjectURL(file),
      //          alt: file.name,
      //       }));
      //       return Promise.resolve(f);
      //    },
      // }),
      // SaveExtension.configure({
      //    saveCallback: async (content) => {
      //       const doc = getDoc();
      //       const updateDocAsync = getUpdateDocAsync();
      //       if (!doc?.uuid || doc.is_locked) return;
      //       await updateDocAsync(doc.uuid, { content });
      //    },
      // }),
      // InlineSuggestionExtension.configure({
      //    requestSuggestion: createRequestInlineSuggestionCallback(getEditor, getDoc, abortControllerRef),
      //    debounceMs: 500,
      //    contextLength: 4000,
      // }),
      // WindowEventListener.configure({
      //    listeners: {
      //       "editor:block-edit": (event, editor) => {
      //          const customEvent = event as CustomEvent;
      //          const detail = customEvent.detail;
      //          console.log("Block edit event", detail);
      //          // Accept a single edit object (not array)
      //          if (!detail || typeof detail !== "object" || Array.isArray(detail) || !detail.updateId) return;
      //          const isValidEdit =
      //             typeof detail.content === "string" &&
      //             ["replace", "insert", "remove"].includes(detail.editType) &&
      //             ["in_place", "after_block", "before_block"].includes(detail.placement) &&
      //             detail.range &&
      //             typeof detail.range.from === "number" &&
      //             typeof detail.range.to === "number";
      //          if (!isValidEdit) return;
      //          const blocks = getBlockBasedState(editor);
      //          applySingleEditToEditor(editor, detail as EditWithContent, blocks);
      //       },
      //    },
      // }),
   ];

   // Filter out excluded extensions by name
   return allExtensions.filter((ext) => {
      // Some extensions are functions, some are objects with .name
      const name = typeof ext === "object" && "name" in ext ? ext.name.toLowerCase() : undefined;
      return !name || !excludeExtensions.includes(name);
   });
};

export const useMinimalTiptapEditor = ({
   value,
   output = "json",
   placeholder = "",
   editorClassName,
   throttleDelay = 0,
   onUpdate,
   onBlur,
   characterLimit = MAX_CHARACTERS,
   excludeExtensions = [],
   registerInStore = true,
   enableVersionTracking = false,
   versionTrackingOptions = {},
   ...props
}: UseMinimalTiptapEditorProps) => {
   const throttledSetValue = useThrottle((value: Content) => onUpdate?.(value), throttleDelay);

   const handleUpdate = React.useCallback(
      (editor: Editor) => throttledSetValue(getOutput(editor, output)),
      [output, throttledSetValue]
   );

   const handleBlur = React.useCallback((editor: Editor) => onBlur?.(getOutput(editor, output)), [output, onBlur]);

   // --- Inline suggestion & save integration ---
   const editorRef = React.useRef<Editor | null>(null);
   const abortControllerRef = React.useRef<AbortController | null>(null);
   // Memoize extensions so they're only recreated when dependencies change
   const extensions = createExtensions(
      placeholder,
      characterLimit,
      () => null,
      () => null,
      abortControllerRef,
      () => async () => {},
      excludeExtensions,
      enableVersionTracking,
      versionTrackingOptions
   );

   // Register editor and view in the store
   const setEditor = useEditorRefStore((state) => state.setEditor);

   const handleCreate = React.useCallback(
      (editor: Editor) => {
         // Set content only if the editor is empty to avoid breaking reactivity
         if (value) {
            editor.commands.setContent(value);
         }
         editorRef.current = editor;
         if (registerInStore) {
            setEditor(editor);
         }
      },
      [value, registerInStore, setEditor]
   );

   const editor = useEditor({
      extensions,
      immediatelyRender: false,
      // shouldRerenderOnTransaction: false,
      content: value, // Set initial content directly
      editorProps: {
         attributes: {
            autocomplete: "off",
            autocorrect: "off",
            autocapitalize: "off",
            class: cn("focus:outline-none flex-1 min-h-full", editorClassName),
         },
      },
      onUpdate: ({ editor }) => handleUpdate(editor),
      // onCreate: ({ editor }) => handleCreate(editor),
      onBlur: ({ editor }) => handleBlur(editor),
      ...props,
   });
   console.log("editor", editor);

   return editor;
};

export default useMinimalTiptapEditor;
