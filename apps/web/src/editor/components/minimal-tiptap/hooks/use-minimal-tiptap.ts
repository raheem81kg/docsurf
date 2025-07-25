/**
 * Custom hook for initializing a minimal Tiptap editor with all core and custom extensions.
 * Integrates inline suggestion extension with access to the latest editor and doc from useDocStore.
 *
 * TODO: If editor state is not reactive, audit custom extensions in createExtensions. Try with only core extensions (StarterKit, Placeholder, etc.) to isolate issues.
 */
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
   SearchAndReplace,
} from "../extensions";
import { cn } from "@docsurf/ui/lib/utils";
import { getOutput, randomId } from "../utils";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { MAX_CHARACTERS, MAX_FILE_SIZE, getComparableContent } from "../tiptap-util";
import { IndentHandler, TrailingNode } from "../extensions/custom";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TaskList } from "@tiptap/extension-task-list";
// import CharacterCount from "@tiptap/extension-character-count";
import { ExportWord } from "../extensions/custom/export-word";
import { ImportWord } from "../extensions/custom/import-word";
import { Table } from "../extensions/table";
import { InlineSuggestionExtension } from "../extensions/custom/inline-suggestion/inline-suggestion-plugin";
import { createRequestInlineSuggestionCallback } from "../extensions/custom/inline-suggestion/request-inline-suggestion-callback";
import { WindowEventListener } from "../extensions/window-event-listener";
import { getBlockBasedState, type EditWithContent } from "../edit-utils";
import { useEditorRefStore } from "@/store/use-editor-ref-store";
import { VersionTracker } from "../extensions/custom/version-tracker";
import { applySingleEditToEditor } from "../extensions/apply-edit";
import { env } from "@/env";
import ConfirmBlockChange from "../extensions/confirm-block-change";
import { debounce, isEqual } from "lodash-es";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { ImageExtension } from "../extensions/custom/niazmorshed/image";
import { ImagePlaceholder } from "../extensions/custom/niazmorshed/image-placeholder";
import { Mathematics } from "@tiptap/extension-mathematics";
import { useMutation } from "convex/react";
import { getDocumentHtml } from "@docsurf/utils/chat/get-document-html";
export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
   value?: Content;
   output?: "html" | "json" | "text";
   placeholder?: string;
   editorClassName?: string;
   debounceDelay?: number;
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
   /**
    * Optional callback to run after a successful save.
    */
   onSave?: (content: Content) => void;
   /**
    * Whether this is the main editor instance that should handle content syncing and saving.
    */
   isMainEditor: boolean;
   /**
    * Whether the editor is locked.
    */
   isEditorLocked: boolean;
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
   userId: string | undefined,
   userEmail: string | undefined,
   docId: string | undefined,
   workspaceId: string | undefined,
   abortControllerRef: React.RefObject<AbortController | null>,
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
      Underline,
      TaskItem.configure({ nested: true }),
      // CharacterCount.configure({ limit: characterLimit }),
      Mathematics,
      ImagePlaceholder,
      Image.configure({
         allowedMimeTypes: ["image/*"],
         maxFileSize: MAX_FILE_SIZE,
         allowBase64: false,
         uploadFn: async (file: File) => {
            return { id: randomId(), src: "" };
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
            // Scroll into view to ensure inserted content is visible
            editor.commands.scrollIntoView();
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
      SearchAndReplace,
      FileHandler.configure({
         allowBase64: false,
         allowedMimeTypes: ["image/*"],
         maxFileSize: MAX_FILE_SIZE,
         onDrop: (editor, files, pos) => {
            files.forEach(async (file) => {
               const blobUrl = URL.createObjectURL(file);
               editor.commands.insertContentAt(pos, {
                  type: "image",
                  attrs: { src: blobUrl },
               });
            });
         },
         onPaste: (editor, files) => {
            files.forEach(async (file) => {
               const blobUrl = URL.createObjectURL(file);
               editor.commands.insertContent({
                  type: "image",
                  attrs: { src: blobUrl },
               });
               // Scroll into view to ensure pasted content is visible
               editor.commands.scrollIntoView();
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
      InlineSuggestionExtension.configure({
         requestSuggestion: createRequestInlineSuggestionCallback(userId, docId, workspaceId, abortControllerRef, userEmail),
         debounceMs: 500,
         contextLength: 300,
      }),
      Typography,
      Superscript,
      Subscript,
      UnsetAllMarks,
      HorizontalRule,
      ResetMarksOnEnter,
      CodeBlockLowlight,
      Placeholder.configure({
         placeholder: () => placeholder,
         showOnlyCurrent: true,
         includeChildren: false,
      }),
      Table,
      ConfirmBlockChange,
      ExportWord,
      ImportWord.configure({
         upload: (files: File[]) => {
            const f = files.map((file) => ({
               src: URL.createObjectURL(file),
               alt: file.name,
            }));
            return Promise.resolve(f);
         },
      }),

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

   // Add VersionTracker if enabled
   if (enableVersionTracking) {
      allExtensions.push(
         VersionTracker.configure({
            ...versionTrackingOptions,
            docId,
         })
      );
   }

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
   debounceDelay = 1500,
   onUpdate,
   onBlur,
   characterLimit = MAX_CHARACTERS,
   excludeExtensions = [],
   registerInStore = true,
   enableVersionTracking = false,
   versionTrackingOptions = {},
   onSave,
   isMainEditor,
   isEditorLocked,
   ...props
}: UseMinimalTiptapEditorProps) => {
   // Track if there are unsaved changes
   const hasPendingChanges = React.useRef(false);
   // Track last saved content to avoid unnecessary saves
   const lastSavedContent = React.useRef<Content | null>(value ?? null);
   // Skip the first onUpdate (initial content hydration)
   const skipNextUpdate = React.useRef(true);

   // Warn user if there are unsaved changes before leaving
   React.useEffect(() => {
      const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
         if (hasPendingChanges.current) {
            const message = "You have unsaved changes. Are you sure you want to leave?";
            e.preventDefault();
            e.returnValue = message;
            return message;
         }
      };
      window.addEventListener("beforeunload", beforeUnloadHandler);
      return () => {
         window.removeEventListener("beforeunload", beforeUnloadHandler);
      };
   }, []);

   // Only set pending changes and trigger save if doc changed
   const handleBlur = React.useCallback((editor: Editor) => onBlur?.(getOutput(editor, output)), [output, onBlur]);

   // --- Inline suggestion & save integration ---
   const editorRef = React.useRef<Editor | null>(null);
   const abortControllerRef = React.useRef<AbortController | null>(null);
   const getEditor = React.useCallback(() => editorRef.current, []);

   // Get docId using hooks
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc } = useCurrentDocument(user);
   const docId = doc?._id;
   const userId = user?._id;
   const userEmail = user?.email;
   const workspaceId = doc?.workspaceId;
   // Convex mutation for saving document content
   const updateDocument = useMutation(api.documents.updateDocument);

   // Debounced save function
   const debouncedSave = React.useMemo(
      () =>
         debounce(async (content: Content) => {
            const newComparable = getComparableContent(content);
            const lastComparable = getComparableContent(lastSavedContent.current);
            if (!isEqual(newComparable, lastComparable)) {
               if (import.meta.env.DEV) {
                  // eslint-disable-next-line no-console
                  console.log("Save triggered. Diff:", {
                     newComparable,
                     lastComparable,
                     rawNew: content,
                     rawLast: lastSavedContent.current,
                  });
               }
               if (docId && workspaceId) {
                  try {
                     await updateDocument({
                        workspaceId,
                        id: docId,
                        updates: { content: JSON.stringify(content) },
                     });
                     lastSavedContent.current = content;
                     onUpdate?.(content);
                     onSave?.(content);
                  } catch (err) {
                     showToast("Save failed", "error");
                     if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.error("Save error:", err);
                     }
                  }
               } else {
                  showToast("Cannot save: missing document or workspace ID", "error");
               }
            }
            hasPendingChanges.current = false;
         }, debounceDelay),
      [debounceDelay, onUpdate, docId, workspaceId, updateDocument, onSave, isMainEditor]
   );

   // Memoize extensions so they're only recreated when dependencies change
   const extensions = React.useMemo(
      () =>
         createExtensions(
            placeholder,
            characterLimit,
            getEditor,
            userId,
            userEmail,
            docId,
            workspaceId,
            abortControllerRef,
            excludeExtensions,
            enableVersionTracking,
            versionTrackingOptions
         ),
      [
         placeholder,
         characterLimit,
         excludeExtensions,
         enableVersionTracking,
         versionTrackingOptions,
         getEditor,
         docId,
         userId,
         userEmail,
         workspaceId,
      ]
   );

   // Register editor and view in the store
   const setEditor = useEditorRefStore((state) => state.setEditor);

   const editor = useEditor({
      extensions,
      shouldRerenderOnTransaction: false, // Keep false for performance, we handle character counts manually
      immediatelyRender: true,
      content: value, // Set initial content directly
      editable: !isEditorLocked,
      editorProps: {
         attributes: {
            autocomplete: "off",
            autocorrect: "off",
            autocapitalize: "off",
            class: cn("min-h-full flex-1 focus:outline-none", editorClassName),
         },
         handlePaste: (view, event) => {
            // Let the default paste behavior happen first
            const result = false; // Don't prevent default

            // After paste, scroll into view to ensure content is visible
            setTimeout(() => {
               view.dispatch(view.state.tr.scrollIntoView());
            }, 0);

            return result;
         },
      },
      onUpdate: async ({ editor, transaction }) => {
         if (!isMainEditor) return;
         if (skipNextUpdate.current) {
            skipNextUpdate.current = false;
            return;
         }
         if (transaction.docChanged) {
            // const rawOutput = getOutput(editor, "json");
            // const stringifiedOutput = JSON.stringify(rawOutput);
            // const htmlOutput = await getDocumentHtml(stringifiedOutput);
            // console.log("[DEBUG] getOutput(editor, 'json'):", rawOutput);
            // console.log("[DEBUG] JSON.stringify(getOutput(editor, 'json')):", stringifiedOutput);
            // const blocks = getBlockBasedState(editor);
            // console.log("[DEBUG] blocks:", blocks);
            hasPendingChanges.current = true;
            debouncedSave(getOutput(editor, output));
         }
      },
      onCreate: ({ editor }) => {
         editorRef.current = editor;
         // Expose hasPendingChanges ref on the editor instance
         (editor as any).hasPendingChanges = hasPendingChanges;
      },
      onBlur: ({ editor }) => handleBlur(editor),
      ...props,
   });

   // Always keep the global editor ref in sync with the local editor instance
   React.useEffect(() => {
      if (registerInStore) {
         setEditor(editor ?? null);
         return () => {
            setEditor(null);
         };
      }
   }, [editor, registerInStore, setEditor]);

   return editor;
};

export default useMinimalTiptapEditor;
