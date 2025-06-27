// /**
//  * Version Tracker Extension for Tiptap
//  * Tracks document versions based on time intervals, content changes, and user activity.
//  * Provides automatic versioning with configurable thresholds and intervals.
//  */
// import { Extension } from "@tiptap/core";
// import type { Editor, JSONContent } from "@tiptap/core";
// import { createDocVersion } from "@/lib/persist/queries";
// // import { useDocStore } from "@/store/use-doc-store";

// // Declare command types
// declare module "@tiptap/core" {
//    interface Commands<ReturnType> {
//       versionTracker: {
//          /**
//           * Save the current version of the document
//           * @param reason - The reason for saving the version
//           */
//          saveVersion: (reason?: string) => ReturnType;
//       };
//    }
// }

// export interface VersionTrackerOptions {
//    /** Time-based intervals */
//    saveInterval: number; // 1 minute - reasonable for background saving
//    idleInterval: number; // 15 seconds of inactivity - not too aggressive

//    /** Content-based thresholds */
//    minCharacterChanges: number; // Minimum characters changed to trigger save
//    significantChanges: number; // Major changes threshold for immediate save

//    /** Behavior options */
//    saveOnBlur: boolean; // Save when user leaves editor
//    saveOnSignificantChange: boolean; // Save immediately on major changes

//    /** Debounce to prevent spam */
//    debounceMs: number; // 10 second debounce for rapid changes
// }

// export interface VersionTrackerStorage {
//    lastSavedContent: string | null;
//    lastSavedTime: number | null;
//    currentContent: string | null;
//    changesSinceLastSave: number;
//    contentChanged: boolean;
//    intervalTimer: ReturnType<typeof setInterval> | null;
//    idleTimer: ReturnType<typeof setTimeout> | null;
//    debounceTimer: ReturnType<typeof setTimeout> | null;
// }

// export interface VersionInfo {
//    content: JSONContent;
//    timestamp: number;
//    saveReason: string;
//    changesSinceLastSave: number;
//    timeSinceLastSave: number;
//    wordCount: number;
// }

// // Constants for better maintainability
// const DEFAULT_SAVE_INTERVAL = 120000; // 2 minutes
// const DEFAULT_IDLE_INTERVAL = 30000; // 30 seconds
// const DEFAULT_MIN_CHANGES = 20; // 20 characters
// const DEFAULT_SIGNIFICANT_CHANGES = 3000; // 3000 characters in the editor JSON string
// const DEFAULT_DEBOUNCE_MS = 10000; // 10 seconds

// // Helper functions
// const getWordCount = (editor: Editor): number => {
//    const text = editor.getText();
//    return text.trim() ? text.trim().split(/\s+/).length : 0;
// };

// const clearTimers = (storage: VersionTrackerStorage): void => {
//    if (storage.idleTimer) clearTimeout(storage.idleTimer);
//    if (storage.debounceTimer) clearTimeout(storage.debounceTimer);
// };

// const saveVersionIfChanged = async (editor: Editor, storage: VersionTrackerStorage, reason = "manual"): Promise<void> => {
//    if (!storage.contentChanged) {
//       return;
//    }

//    const currentContent = JSON.stringify(editor.getJSON());
//    const wordCount = getWordCount(editor);

//    // Don't save if there are no words
//    if (wordCount <= 1) {
//       return;
//    }

//    // Don't save if content hasn't actually changed
//    if (currentContent === storage.lastSavedContent) {
//       storage.contentChanged = false;
//       storage.changesSinceLastSave = 0;
//       return;
//    }

//    const now = Date.now();
//    const timeSinceLastSave = now - (storage.lastSavedTime ?? now);

//    // Get document info from store
//    const doc = useDocStore.getState().doc;
//    if (!doc?.uuid) {
//       console.warn("No document UUID available for version tracking");
//       return;
//    }

//    try {
//       // Create version in persistence layer
//       await createDocVersion(
//          doc.uuid,
//          JSON.parse(currentContent),
//          reason as any,
//          storage.changesSinceLastSave,
//          timeSinceLastSave,
//          wordCount
//       );

//       // Log the version
//       console.log("💾 Version saved:", {
//          timestamp: new Date(now).toISOString(),
//          reason: reason,
//          changes: storage.changesSinceLastSave,
//          timeSince: `${Math.round(timeSinceLastSave / 1000)}s`,
//          words: wordCount,
//       });

//       // Update tracking state
//       storage.lastSavedContent = currentContent;
//       storage.lastSavedTime = now;
//       storage.contentChanged = false;
//       storage.changesSinceLastSave = 0;

//       // Clear timers
//       clearTimers(storage);
//    } catch (error) {
//       console.error("Failed to save version:", error);
//    }
// };

// export const VersionTracker = Extension.create<VersionTrackerOptions, VersionTrackerStorage>({
//    name: "versionTracker",

//    addOptions() {
//       return {
//          saveInterval: DEFAULT_SAVE_INTERVAL,
//          idleInterval: DEFAULT_IDLE_INTERVAL,
//          minCharacterChanges: DEFAULT_MIN_CHANGES,
//          significantChanges: DEFAULT_SIGNIFICANT_CHANGES,
//          saveOnBlur: true,
//          saveOnSignificantChange: true,
//          debounceMs: DEFAULT_DEBOUNCE_MS,
//       };
//    },

//    addStorage() {
//       return {
//          lastSavedContent: null,
//          lastSavedTime: null,
//          currentContent: null,
//          changesSinceLastSave: 0,
//          contentChanged: false,
//          intervalTimer: null,
//          idleTimer: null,
//          debounceTimer: null,
//       };
//    },

//    onCreate() {
//       const editor = this.editor;
//       if (!editor) return;

//       // Initialize tracking state
//       this.storage.lastSavedContent = JSON.stringify(editor.getJSON());
//       this.storage.lastSavedTime = Date.now();
//       this.storage.currentContent = this.storage.lastSavedContent;
//       this.storage.changesSinceLastSave = 0;
//       this.storage.contentChanged = false;

//       // Start periodic auto-save interval
//       this.storage.intervalTimer = setInterval(() => {
//          saveVersionIfChanged(editor, this.storage, "interval");
//       }, this.options.saveInterval);

//       console.log("📝 Version Tracker initialized");
//    },

//    onUpdate() {
//       const editor = this.editor;
//       if (!editor) return;

//       const newContent = JSON.stringify(editor.getJSON());
//       const oldContent = this.storage.currentContent;

//       // Calculate content changes
//       const charDifference = Math.abs(newContent.length - (oldContent?.length ?? 0));
//       this.storage.changesSinceLastSave += charDifference;
//       this.storage.currentContent = newContent;
//       this.storage.contentChanged = true;

//       // Clear existing timers
//       clearTimers(this.storage);

//       // Check for significant changes (immediate save)
//       if (this.options.saveOnSignificantChange && this.storage.changesSinceLastSave >= this.options.significantChanges) {
//          saveVersionIfChanged(editor, this.storage, "significant-change");
//          return;
//       }

//       // Set debounced save for rapid typing
//       this.storage.debounceTimer = setTimeout(() => {
//          // Check if we've reached minimum change threshold
//          if (this.storage.changesSinceLastSave >= this.options.minCharacterChanges) {
//             saveVersionIfChanged(editor, this.storage, "debounced-threshold");
//          }
//       }, this.options.debounceMs);

//       // Set idle timer (save after period of inactivity)
//       this.storage.idleTimer = setTimeout(() => {
//          saveVersionIfChanged(editor, this.storage, "idle");
//       }, this.options.idleInterval);
//    },

//    onBlur() {
//       const editor = this.editor;
//       if (!editor || !this.options.saveOnBlur) return;

//       // Clear timers since we're saving now
//       clearTimers(this.storage);

//       saveVersionIfChanged(editor, this.storage, "blur");
//    },

//    onFocus() {
//       console.log("✏️ Editor focused - version tracking active");
//    },

//    onDestroy() {
//       // Clean up all timers
//       if (this.storage.intervalTimer) clearInterval(this.storage.intervalTimer);
//       clearTimers(this.storage);

//       console.log("🔄 Version Tracker destroyed");
//    },

//    addCommands() {
//       return {
//          saveVersion:
//             (reason = "manual") =>
//             ({ editor }) => {
//                saveVersionIfChanged(editor, this.storage, reason);
//                return true;
//             },
//       };
//    },

//    addMethods() {
//       return {
//          getWordCount: (editor: Editor): number => getWordCount(editor),
//       };
//    },
// });
