// /**
//  * Tiptap SaveExtension: Efficient, robust, and debounced document saving with retry and content comparison.
//  * Integrates with Zustand for save status. Uses fast-deep-equal, object-hash, and p-retry for reliability.
//  * Supports offline-first with automatic sync when online.
//  */
// import { Extension, type Editor, type Command } from "@tiptap/react";
// import debounce from "lodash/debounce";
// import throttle from "lodash/throttle";
// import { Plugin } from "@tiptap/pm/state";
// import type { EditorView } from "@tiptap/pm/view";
// // import { useDocStore } from "@/store/use-doc-store";
// import isEqual from "fast-deep-equal";
// import objectHash from "object-hash";
// import pRetry, { AbortError } from "p-retry";
// import { MAX_FILE_SIZE } from "../../tiptap-util";

// // Symbols for advanced access
// export const IS_DOC_CHANGED_SYMBOL = Symbol("isDocChanged");
// export const GET_LAST_SAVED_CONTENT_SYMBOL = Symbol("getLastSavedContent");
// export const FORCE_SAVE_SYMBOL = Symbol("forceSave");
// export const CANCEL_SAVE_SYMBOL = Symbol("cancelSave");
// export const HAS_PENDING_SAVE_SYMBOL = Symbol("hasPendingSave");

// // Add type declarations for Editor methods
// declare module "@tiptap/react" {
//    interface Editor {
//       isDocChanged(): boolean;
//       getLastSavedContent(): unknown;
//       forceSave(): Promise<boolean>;
//       cancelSave(): void;
//       hasPendingSave(): boolean;
//    }
// }

// export interface SaveExtensionOptions {
//    saveCallback: (content: unknown) => Promise<void>;
//    debounceMs?: number;
//    throttleMs?: number;
//    maxRetries?: number;
//    retryDelayMs?: number;
//    isLocked?: () => boolean;
//    getDocUuid?: () => string | undefined;
//    /**
//     * Called after a successful save, with the serialized content (JSON string).
//     */
//    onDocVersionContentChange?: (serializedContent: string) => void;
//    onSaveStatusChange?: (status: string, error?: Error) => void;
//    enableBeforeUnloadWarning?: boolean;
//    maxContentSizeBytes?: number;
//    /**
//     * Whether the initial content should be considered as "saved".
//     * Set to false if you want to trigger a save when the editor is first loaded with content.
//     */
//    considerInitialContentAsSaved?: boolean;
//    /**
//     * Strategy for comparing content changes
//     */
//    contentComparator?: (a: unknown, b: unknown) => boolean;
// }

// interface SaveExtensionStorage {
//    lastSavedContent: any;
//    lastSavedHash: string;
//    debouncedSave: ((editor: Editor) => void) & { cancel(): void };
//    throttledHashCheck: (() => void) & { cancel(): void };
//    beforeUnloadHandler: (e: BeforeUnloadEvent) => void;
//    updateBeforeUnload: () => void;
//    inflightSave: Promise<void> | null;
//    isDestroyed: boolean;
//    abortController: AbortController | null;
//    hasUnsavedChanges: boolean;
//    isInitialized: boolean;
//    isOnline: boolean;
//    handleOnline: () => void;
//    handleOffline: () => void;
//    hasPendingSave: boolean;
//    pendingSaveTimeout: NodeJS.Timeout | null;
// }

// const DEFAULT_OPTIONS = {
//    debounceMs: 1200,
//    throttleMs: 100,
//    maxRetries: 2,
//    retryDelayMs: 1000,
//    enableBeforeUnloadWarning: true,
//    maxContentSizeBytes: MAX_FILE_SIZE,
//    considerInitialContentAsSaved: true,
// } as const;

// /**
//  * Enhanced content comparison with multiple strategies
//  */
// export function createContentComparator(strategy: "json" | "hash" | "deep" = "hash") {
//    switch (strategy) {
//       case "json":
//          return (a: unknown, b: unknown): boolean => JSON.stringify(a) !== JSON.stringify(b);
//       case "hash":
//          return (a: unknown, b: unknown): boolean => objectHash(a as object) !== objectHash(b as object);
//       case "deep":
//          return (a: unknown, b: unknown): boolean => !isEqual(a, b);
//       default:
//          return (a: unknown, b: unknown): boolean => JSON.stringify(a) !== JSON.stringify(b);
//    }
// }

// const getContentSizeBytes = (content: unknown): number => {
//    try {
//       return new Blob([JSON.stringify(content)]).size;
//    } catch (error) {
//       console.warn("JSON serialization failed:", error);
//       return 0;
//    }
// };

// const performSave = async (ext: any, editor: Editor): Promise<boolean> => {
//    const storage = ext.storage as SaveExtensionStorage;
//    // const docStore = useDocStore.getState();

//    // Prevent concurrent saves and handle race conditions
//    if (storage.isDestroyed || storage.inflightSave || ext.options.isLocked?.()) {
//       console.log("[SaveExtension] Save prevented - destroyed/inflight/locked");
//       return false;
//    }

//    // // Check if there's already a save in progress in the store
//    // if (docStore.saveStatus === "start") {
//    //    console.log("[SaveExtension] Save prevented - save in progress");
//    //    return false;
//    // }

//    try {
//       const currentContent = editor.getJSON();

//       // Check content size
//       const contentSize = getContentSizeBytes(currentContent);
//       if (ext.options.maxContentSizeBytes && contentSize > ext.options.maxContentSizeBytes) {
//          throw new Error(`Content size (${contentSize} bytes) exceeds limit of ${ext.options.maxContentSizeBytes} bytes`);
//       }

//       // Check if content has changed using the configured comparator
//       if (!ext.options.contentComparator!(currentContent, storage.lastSavedContent)) {
//          console.log("[SaveExtension] No content changes detected");
//          return false;
//       }

//       // If offline, just mark that we have unsaved changes
//       if (!storage.isOnline) {
//          console.log("[SaveExtension] Offline - marking unsaved changes");
//          storage.hasUnsavedChanges = true;
//          ext.options.onSaveStatusChange?.("queued", undefined);
//          return true;
//       }

//       console.log("[SaveExtension] Attempting to save content");
//       storage.abortController = new AbortController();
//       storage.inflightSave = saveWithRetry(ext, currentContent, storage.abortController.signal);

//       await storage.inflightSave;

//       storage.lastSavedContent = JSON.parse(JSON.stringify(currentContent));
//       storage.lastSavedHash = objectHash(currentContent as object);
//       storage.hasUnsavedChanges = false; // Clear unsaved changes flag after successful save

//       ext.options.onDocVersionContentChange?.(JSON.stringify(currentContent));
//       ext.options.onSaveStatusChange?.("success", undefined);
//       console.log("[SaveExtension] Save successful");
//       return true;
//    } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
//       console.error("[SaveExtension] Save failed:", errorMessage);
//       ext.options.onSaveStatusChange?.("error", new Error(`Save failed: ${errorMessage}`));
//       return false;
//    } finally {
//       storage.inflightSave = null;
//       storage.abortController = null;
//       storage.updateBeforeUnload();
//    }
// };

// const saveWithRetry = (ext: any, content: unknown, signal: AbortSignal): Promise<void> => {
//    const { maxRetries = DEFAULT_OPTIONS.maxRetries, retryDelayMs = DEFAULT_OPTIONS.retryDelayMs } = ext.options;

//    return pRetry(
//       async () => {
//          if (signal.aborted || ext.storage.isDestroyed) {
//             throw new AbortError("Save aborted");
//          }
//          await ext.options.saveCallback(content);
//       },
//       {
//          retries: maxRetries,
//          minTimeout: retryDelayMs,
//          factor: 2,
//          onFailedAttempt: (error) => {
//             if (signal.aborted || ext.storage.isDestroyed) {
//                throw new AbortError("Save aborted");
//             }
//             ext.options.onSaveStatusChange?.("retrying", error);
//          },
//       }
//    );
// };

// export const SaveExtension = Extension.create<SaveExtensionOptions, SaveExtensionStorage>({
//    name: "saveExtension",

//    addOptions() {
//       return {
//          saveCallback: async () => {},
//          ...DEFAULT_OPTIONS,
//          contentComparator: createContentComparator("hash"),
//       };
//    },

//    addStorage() {
//       return {
//          isDestroyed: false,
//          inflightSave: null,
//          abortController: null,
//          lastSavedContent: null,
//          lastSavedHash: "",
//          hasUnsavedChanges: false,
//          isInitialized: false,
//          isOnline: navigator.onLine,
//          debouncedSave: null as any,
//          throttledHashCheck: null as any,
//          beforeUnloadHandler: null as any,
//          updateBeforeUnload: null as any,
//          handleOnline: null as any,
//          handleOffline: null as any,
//          hasPendingSave: false,
//          pendingSaveTimeout: null,
//       } as SaveExtensionStorage;
//    },

//    onCreate() {
//       const storage = this.storage as SaveExtensionStorage;
//       try {
//          storage.isDestroyed = false;
//          storage.inflightSave = null;
//          storage.abortController = null;
//          storage.hasUnsavedChanges = false;
//          storage.isInitialized = false;
//          storage.isOnline = navigator.onLine;
//          console.log("[SaveExtension] Initialized, online status:", storage.isOnline);

//          if (this.editor) {
//             try {
//                const currentContent = this.editor.getJSON();
//                storage.lastSavedContent = JSON.parse(JSON.stringify(currentContent));
//                storage.lastSavedHash = objectHash(currentContent);
//             } catch {
//                storage.lastSavedContent = null;
//                storage.lastSavedHash = "";
//             }
//          } else {
//             storage.lastSavedContent = null;
//             storage.lastSavedHash = "";
//          }

//          // Define event handlers
//          storage.handleOnline = () => {
//             console.log("[SaveExtension] Online status changed: online");
//             storage.isOnline = true;
//             // If we have unsaved changes, trigger a save
//             if (storage.hasUnsavedChanges && this.editor) {
//                console.log("[SaveExtension] Triggering save after coming online");
//                // Cancel any pending debounced saves
//                storage.debouncedSave?.cancel();
//                // Reset the save status in the store
//                // useDocStore.getState().setSaveStatus(null);
//                // Force an immediate save
//                performSave(this, this.editor).catch(console.error);
//             }
//          };

//          storage.handleOffline = () => {
//             console.log("[SaveExtension] Online status changed: offline");
//             storage.isOnline = false;
//          };

//          storage.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
//             if (!this.options.enableBeforeUnloadWarning) return;

//             if (storage.hasUnsavedChanges) {
//                const message = "You have unsaved changes. Are you sure you want to leave?";
//                e.preventDefault();
//                e.returnValue = message;
//                return message;
//             }
//          };

//          storage.updateBeforeUnload = () => {
//             if (!this.options.enableBeforeUnloadWarning) return;
//             try {
//                window.removeEventListener("beforeunload", storage.beforeUnloadHandler);
//                window.addEventListener("beforeunload", storage.beforeUnloadHandler);
//             } catch {}
//          };

//          // Initial setup of the beforeunload handler
//          storage.updateBeforeUnload();

//          // Setup throttled content check
//          storage.throttledHashCheck = throttle(() => {
//             if (storage.isDestroyed || !this.editor) return;

//             const currentContent = this.editor.getJSON();
//             const currentHash = objectHash(currentContent);

//             // Only check for changes after initialization
//             if (storage.isInitialized) {
//                const hasChanges = currentHash !== storage.lastSavedHash;
//                if (hasChanges) {
//                   console.log("[SaveExtension] Content changed, triggering save");
//                   storage.hasUnsavedChanges = true;
//                   if (storage.isOnline) {
//                      // Reset the save status in the store before triggering a new save
//                      // useDocStore.getState().setSaveStatus(null);
//                      storage.debouncedSave(this.editor);
//                   }
//                }
//             }
//          }, this.options.throttleMs);

//          // Setup debounced save
//          storage.debouncedSave = debounce(
//             async (editor: Editor) => {
//                if (storage.isDestroyed) return;
//                storage.hasPendingSave = true;
//                const success = await performSave(this, editor);
//                if (success) {
//                   storage.hasUnsavedChanges = false;
//                }
//                storage.hasPendingSave = false;
//             },
//             this.options.debounceMs,
//             { leading: false, trailing: true }
//          ) as SaveExtensionStorage["debouncedSave"];

//          // Add online/offline event listeners
//          window.addEventListener("online", storage.handleOnline);
//          window.addEventListener("offline", storage.handleOffline);

//          // Initialize editor methods
//          if (this.editor) {
//             this.editor.isDocChanged = () => {
//                try {
//                   const currentContent = this.editor.getJSON();
//                   return this.options.contentComparator!(currentContent, storage.lastSavedContent);
//                } catch (error) {
//                   console.error("Error checking doc changes:", error);
//                   return false;
//                }
//             };

//             this.editor.getLastSavedContent = () => storage.lastSavedContent;
//             this.editor.forceSave = async () => {
//                if (storage.isDestroyed) return false;
//                return await performSave(this, this.editor);
//             };
//             this.editor.cancelSave = () => {
//                storage.abortController?.abort();
//                storage.abortController = null;
//                storage.debouncedSave?.cancel();
//                storage.inflightSave = null;
//             };

//             this.editor.hasPendingSave = () => {
//                return storage.hasPendingSave;
//             };

//             // Add symbols for advanced access
//             (this.editor as any)[IS_DOC_CHANGED_SYMBOL] = this.editor.isDocChanged;
//             (this.editor as any)[GET_LAST_SAVED_CONTENT_SYMBOL] = this.editor.getLastSavedContent;
//             (this.editor as any)[FORCE_SAVE_SYMBOL] = this.editor.forceSave;
//             (this.editor as any)[CANCEL_SAVE_SYMBOL] = this.editor.cancelSave;
//             (this.editor as any)[HAS_PENDING_SAVE_SYMBOL] = this.editor.hasPendingSave;
//          }
//       } catch (error) {
//          console.error("Error initializing SaveExtension:", error);
//       }
//    },

//    onUpdate() {
//       const storage = this.storage as SaveExtensionStorage;
//       if (!storage.isInitialized && this.editor?.isFocused) {
//          storage.isInitialized = true;
//          console.log("[SaveExtension] Editor initialized");
//       }
//    },

//    onFocus() {
//       const storage = this.storage as SaveExtensionStorage;
//       if (!storage.isInitialized) {
//          storage.isInitialized = true;
//       }
//    },

//    onDestroy() {
//       const storage = this.storage as SaveExtensionStorage;
//       storage.isDestroyed = true;

//       storage.debouncedSave?.cancel();
//       storage.throttledHashCheck?.cancel();
//       storage.abortController?.abort();
//       if (storage.pendingSaveTimeout) {
//          clearTimeout(storage.pendingSaveTimeout);
//       }
//       window.removeEventListener("beforeunload", storage.beforeUnloadHandler);
//       window.removeEventListener("online", storage.handleOnline);
//       window.removeEventListener("offline", storage.handleOffline);
//       storage.inflightSave = null;
//    },

//    addCommands() {
//       return {
//          save:
//             () =>
//             ({ editor }: { editor: Editor }) => {
//                const storage = this.storage as SaveExtensionStorage;
//                if (storage.isDestroyed) return false;
//                performSave(this, editor).catch((error) => {
//                   console.error("Save command failed:", error);
//                });
//                return true;
//             },

//          cancelSave:
//             () =>
//             ({ editor }: { editor: Editor }) => {
//                const storage = this.storage as SaveExtensionStorage;
//                storage.abortController?.abort();
//                storage.abortController = null;
//                storage.debouncedSave?.cancel();
//                storage.inflightSave = null;
//                return true;
//             },
//       } as unknown as Partial<Record<string, Command>>;
//    },

//    addProseMirrorPlugins() {
//       const ext = this;
//       return [
//          new Plugin({
//             view(editorView: EditorView) {
//                let prevDoc = editorView.state.doc;
//                return {
//                   update(view: EditorView) {
//                      if (ext.storage.isDestroyed) return;
//                      if (view.state.doc !== prevDoc && !ext.options.isLocked?.()) {
//                         prevDoc = view.state.doc;
//                         ext.storage.throttledHashCheck?.();
//                      }
//                   },
//                   destroy() {
//                      if (ext.storage.isDestroyed) return;
//                      const storage = ext.storage as SaveExtensionStorage;
//                      storage.debouncedSave?.cancel();
//                      storage.throttledHashCheck?.cancel();
//                      storage.abortController?.abort();
//                      window.removeEventListener("beforeunload", storage.beforeUnloadHandler);
//                   },
//                };
//             },
//          }),
//       ];
//    },
// });
