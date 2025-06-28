/**
 * Version Tracker Extension for Tiptap
 * Tracks document versions based on time intervals, content changes, and user activity.
 * Provides automatic versioning with configurable thresholds and intervals.
 */
import { Extension } from "@tiptap/react";
import type { Editor, JSONContent } from "@tiptap/react";
import { createDocVersion, getLastNDocVersions, hashContent } from "@/lib/persist/queries";
import { getComparableContent } from "../../tiptap-util";
// import { useDocStore } from "@/store/use-doc-store";

// Declare command types
declare module "@tiptap/react" {
   interface Commands<ReturnType> {
      versionTracker: {
         /**
          * Save the current version of the document
          * @param reason - The reason for saving the version
          */
         saveVersion: (reason?: string) => ReturnType;
      };
   }
}

export interface VersionTrackerOptions {
   /** Time-based intervals */
   saveInterval: number; // 1 minute - reasonable for background saving
   idleInterval: number; // 15 seconds of inactivity - not too aggressive

   /** Content-based thresholds */
   minCharacterChanges: number; // Minimum characters changed to trigger save
   significantChanges: number; // Major changes threshold for immediate save

   /** Behavior options */
   saveOnBlur: boolean; // Save when user leaves editor
   saveOnSignificantChange: boolean; // Save immediately on major changes

   /** Debounce to prevent spam */
   debounceMs: number; // 10 second debounce for rapid changes

   /** Document ID for version tracking */
   docId?: string;
}

export interface VersionTrackerStorage {
   lastSavedContentHash: string | null;
   lastSavedTime: number | null;
   lastSavedWordCount: number;
   changesSinceLastSave: number;
   contentChanged: boolean;
   intervalTimer: ReturnType<typeof setInterval> | null;
   idleTimer: ReturnType<typeof setTimeout> | null;
   debounceTimer: ReturnType<typeof setTimeout> | null;
   isSaving: boolean;
   lastSessionContent?: string; // for session-local content comparison
}

export interface VersionInfo {
   content: JSONContent;
   timestamp: number;
   saveReason: string;
   changesSinceLastSave: number;
   timeSinceLastSave: number;
   wordCount: number;
}

// Constants for better maintainability
const DEFAULT_SAVE_INTERVAL = 120000; // 2 minutes
const DEFAULT_IDLE_INTERVAL = 60000; // 1 minute
const DEFAULT_MIN_CHANGES = 40; // 40 characters
const DEFAULT_SIGNIFICANT_CHANGES = 3000; // 3000 characters in the editor JSON string
const DEFAULT_DEBOUNCE_MS = 10000; // 10 seconds

// Helper functions
const getWordCount = (editor: Editor): number => {
   const text = editor.getText();
   return text.trim() ? text.trim().split(/\s+/).length : 0;
};

const clearTimers = (storage: VersionTrackerStorage): void => {
   if (storage.idleTimer) clearTimeout(storage.idleTimer);
   if (storage.debounceTimer) clearTimeout(storage.debounceTimer);
};

const saveVersionIfChanged = async (
   editor: Editor,
   storage: VersionTrackerStorage,
   options: VersionTrackerOptions,
   reason = "manual"
): Promise<void> => {
   // Prevent concurrent saves
   if (storage.isSaving) {
      if (process.env.NODE_ENV !== "production") {
         console.log("[VersionTracker] Save already in progress, skipping");
      }
      return;
   }

   const docId = options.docId;
   if (!docId) {
      console.warn("No document UUID available for version tracking");
      return;
   }

   // Early exit if no content changed
   if (!storage.contentChanged) {
      if (process.env.NODE_ENV !== "production") {
         console.log("[VersionTracker] No content changed, skipping save");
      }
      return;
   }

   storage.isSaving = true;

   try {
      const currentRaw = editor.getJSON();
      const comparable = getComparableContent(currentRaw);
      const currentContentHash = await hashContent(comparable);

      // Check for duplicate content (in-memory)
      if (storage.lastSavedContentHash === currentContentHash) {
         if (process.env.NODE_ENV !== "production") {
            console.log("[VersionTracker] Content hash unchanged, skipping save");
         }
         storage.contentChanged = false;
         storage.changesSinceLastSave = 0;
         return;
      }

      // Additional deduplication check against recent versions in Dexie
      const lastVersions = await getLastNDocVersions(docId, 3);
      const isDuplicate = lastVersions.some((v) => v.contentHash === currentContentHash);
      if (isDuplicate) {
         if (process.env.NODE_ENV !== "production") {
            console.log("[VersionTracker] Content matches recent version, skipping save");
         }
         storage.contentChanged = false;
         storage.changesSinceLastSave = 0;
         return;
      }

      // Calculate word count properly
      const currentWordCount = getWordCount(editor);

      // Skip if document is too short (but allow deletion tracking)
      if (currentWordCount <= 1 && (storage.lastSavedWordCount ?? 0) <= 1) {
         if (process.env.NODE_ENV !== "production") {
            console.log("[VersionTracker] Document too short, skipping save");
         }
         return;
      }

      // Check thresholds before saving
      const significantChanges = options.significantChanges ?? 3000;
      const minChanges = options.minCharacterChanges ?? 40;

      // Force save conditions
      const hasSignificantChanges = storage.changesSinceLastSave >= significantChanges;
      const hasMinimalChanges = storage.changesSinceLastSave >= minChanges;
      const isManualSave = reason === "manual";
      const isBlurSave = reason === "blur";
      const isIntervalSave = reason === "interval";

      // Only save if we meet criteria
      if (!hasSignificantChanges && !isManualSave && !isBlurSave && !isIntervalSave && !hasMinimalChanges) {
         if (process.env.NODE_ENV !== "production") {
            console.log("[VersionTracker] Thresholds not met, skipping save");
         }
         return;
      }

      const now = Date.now();
      const timeSinceLastSave = now - (storage.lastSavedTime ?? now);

      await createDocVersion(docId, currentRaw, reason as any, storage.changesSinceLastSave, timeSinceLastSave, currentWordCount);

      console.log("💾 Version saved:", {
         timestamp: new Date(now).toISOString(),
         reason,
         changes: storage.changesSinceLastSave,
         wordCount: currentWordCount,
         wordChange: currentWordCount - (storage.lastSavedWordCount ?? 0),
         timeSince: `${Math.round(timeSinceLastSave / 1000)}s`,
      });

      // Update tracking state
      storage.lastSavedContentHash = currentContentHash;
      storage.lastSavedTime = now;
      storage.lastSavedWordCount = currentWordCount;
      storage.contentChanged = false;
      storage.changesSinceLastSave = 0;

      // Clear timers
      clearTimers(storage);
   } catch (error) {
      console.error("[VersionTracker] Failed to save version:", error);
   } finally {
      storage.isSaving = false;
   }
};

export const VersionTracker = Extension.create<VersionTrackerOptions, VersionTrackerStorage>({
   name: "versionTracker",

   addOptions() {
      return {
         saveInterval: DEFAULT_SAVE_INTERVAL,
         idleInterval: DEFAULT_IDLE_INTERVAL,
         minCharacterChanges: DEFAULT_MIN_CHANGES,
         significantChanges: DEFAULT_SIGNIFICANT_CHANGES,
         saveOnBlur: true,
         saveOnSignificantChange: true,
         debounceMs: DEFAULT_DEBOUNCE_MS,
      };
   },

   addStorage() {
      return {
         lastSavedContentHash: null,
         lastSavedTime: null,
         lastSavedWordCount: 0,
         changesSinceLastSave: 0,
         contentChanged: false,
         intervalTimer: null,
         idleTimer: null,
         debounceTimer: null,
         isSaving: false,
      };
   },

   onCreate() {
      const editor = this.editor;
      if (!editor) return;

      // Initialize tracking state
      this.storage.lastSavedContentHash = JSON.stringify(editor.getJSON());
      this.storage.lastSavedTime = Date.now();
      this.storage.lastSavedWordCount = getWordCount(editor);
      this.storage.changesSinceLastSave = 0;
      this.storage.contentChanged = false;

      // Start periodic auto-save interval
      this.storage.intervalTimer = setInterval(() => {
         saveVersionIfChanged(editor, this.storage, this.options, "interval");
      }, this.options.saveInterval);

      console.log("📝 Version Tracker initialized");
   },

   onUpdate() {
      const editor = this.editor;
      if (!editor) return;

      // Don't process updates while saving
      if (this.storage.isSaving) return;

      const newContent = JSON.stringify(editor.getJSON());
      if (!this.storage.lastSessionContent) this.storage.lastSessionContent = "";
      const oldContent = this.storage.lastSessionContent;

      // Calculate content changes more accurately
      if (newContent !== oldContent) {
         const charDifference = Math.abs(newContent.length - (oldContent?.length ?? 0));
         this.storage.changesSinceLastSave += charDifference;
         this.storage.contentChanged = true;
         this.storage.lastSessionContent = newContent;

         // Clear existing timers
         clearTimers(this.storage);

         // Check for significant changes (immediate save)
         if (this.options.saveOnSignificantChange && this.storage.changesSinceLastSave >= this.options.significantChanges) {
            saveVersionIfChanged(editor, this.storage, this.options, "significant-change");
            return;
         }

         // Set debounced save for moderate changes
         if (this.storage.changesSinceLastSave >= this.options.minCharacterChanges) {
            this.storage.debounceTimer = setTimeout(() => {
               saveVersionIfChanged(editor, this.storage, this.options, "debounced-threshold");
            }, this.options.debounceMs);
         }

         // Set idle timer (save after period of inactivity)
         this.storage.idleTimer = setTimeout(() => {
            saveVersionIfChanged(editor, this.storage, this.options, "idle");
         }, this.options.idleInterval);
      }
   },

   onBlur() {
      const editor = this.editor;
      if (!editor || !this.options.saveOnBlur) return;

      // Clear timers since we're saving now
      clearTimers(this.storage);

      saveVersionIfChanged(editor, this.storage, this.options, "blur");
   },

   onFocus() {
      console.log("✏️ Editor focused - version tracking active");
   },

   onDestroy() {
      // Clean up all timers
      if (this.storage.intervalTimer) clearInterval(this.storage.intervalTimer);
      clearTimers(this.storage);

      console.log("🔄 Version Tracker destroyed");
   },

   addCommands() {
      return {
         saveVersion:
            (reason = "manual") =>
            ({ editor }) => {
               saveVersionIfChanged(editor, this.storage, this.options, reason);
               return true;
            },
      };
   },

   addMethods() {
      return {
         getWordCount: (editor: Editor): number => getWordCount(editor),
      };
   },
});
