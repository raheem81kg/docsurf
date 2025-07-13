import * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { MAX_CHARACTERS } from "../../tiptap-util";
import { ActionButton } from "../../extensions/image/components/image-actions";
import { FileUpIcon, DownloadIcon, LockIcon, UnlockIcon, Trash2Icon, SendIcon } from "lucide-react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { showProgressToast, hideProgressToast } from "@docsurf/ui/components/_c/toast/progressToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@docsurf/ui/components/dialog";
import { cn } from "@docsurf/ui/lib/utils";
import { ClockRewind } from "@/editor/components/custom/ui/diffview/lib/icons";
import VersionHistoryDialog from "@/editor/components/custom/version-history-dialog";
import { ShareDocButton } from "@/editor/components/custom/share-doc-button";
import { ToolbarSection } from "../toolbar-section";
import type { FormatAction } from "../../types";
import { useBreakpoint } from "@docsurf/ui/hooks/use-breakpoint";

/**
 * SectionSix displays character/word count and formatting actions in the bottom toolbar.
 * - Left: Remaining characters (turns red if limit reached)
 * - Center: Fixed text '30 | 3 words'
 * - Right: SectionTwo (formatting actions)
 */

// Define the allowed action values for SectionSix, including clear/lock for completeness
export type SectionSixAction = "share" | "exportWord" | "importWord" | "versionHistory" | "clearEditor" | "lockEditor";

export interface SectionSixProps {
   editor: Editor;
   docId: string;
   docTitle?: string;
   characterLimit?: number;
   isDocLocked?: boolean;
   loadingDoc?: boolean;
   toggleLock?: () => void;
   activeActions?: SectionSixAction[];
}

export const SectionSix: React.FC<SectionSixProps> = ({
   editor,
   docId,
   docTitle = "",
   characterLimit = MAX_CHARACTERS,
   isDocLocked,
   loadingDoc,
   toggleLock,
   activeActions = ["share", "exportWord", "importWord", "versionHistory", "lockEditor", "clearEditor"],
}) => {
   // Flip logic: isWide is true when window.innerWidth >= 1324
   const isWide = !useBreakpoint(1300);
   const { characterCount, wordCount } = useEditorState({
      editor,
      selector: (ctx) => {
         return {
            characterCount: ctx.editor.storage.characterCount.characters(),
            wordCount: ctx.editor.storage.characterCount.words(),
         };
      },
   });

   const [loading, setLoading] = React.useState(false);
   const fileInput = React.useRef<HTMLInputElement>(null);
   // Use character and word counts from editor.storage.characterCount
   const used = characterCount ?? 0;
   const words = wordCount ?? 0;
   const remaining = characterLimit - used;
   const isLimit = used >= characterLimit;
   const [showClearDialog, setShowClearDialog] = React.useState(false);
   const [openVersionHistoryDialog, setOpenVersionHistoryDialog] = React.useState(false);

   // --- ACTIONS SETUP ---
   // Handler to open share dialog
   const [openShareDialog, setOpenShareDialog] = React.useState(false);

   const sectionSixActions: FormatAction[] = [
      {
         value: "share",
         label: "Share",
         icon: <SendIcon className="size-4" />,
         action: () => setOpenShareDialog(true),
         isActive: () => false,
         canExecute: () => !!docId,
         shortcuts: [],
      },
      {
         value: "exportWord",
         label: "Export as Word",
         icon: <DownloadIcon className="size-4" />,
         action: () => handleExport(),
         isActive: () => false,
         canExecute: () => !!docId,
         shortcuts: [],
      },
      {
         value: "importWord",
         label: loading ? "Importing..." : "Import Word",
         icon: <FileUpIcon className="size-4" />,
         action: () => triggerFileInput(),
         isActive: () => false,
         canExecute: () => !!docId && !loading,
         shortcuts: [],
      },
      {
         value: "versionHistory",
         label: "Version History",
         icon: <ClockRewind size={16} />,
         action: () => setOpenVersionHistoryDialog(true),
         isActive: () => openVersionHistoryDialog,
         canExecute: () => !!docId,
         shortcuts: [],
      },
      {
         value: "lockEditor",
         label: isDocLocked ? "Unlock Editor" : "Lock Editor",
         icon: isDocLocked ? <UnlockIcon className="size-4" /> : <LockIcon className="size-4" />,
         action: () => toggleLock?.(),
         isActive: () => !!isDocLocked,
         canExecute: () => !!docId,
         shortcuts: [],
      },
      {
         value: "clearEditor",
         label: "Clear Editor",
         icon: <Trash2Icon className="size-4" />,
         action: () => setShowClearDialog(true),
         isActive: () => false,
         canExecute: () => !isDocLocked,
         shortcuts: [],
      },
   ];

   // Sync Tiptap's editable state with isDocLocked
   React.useEffect(() => {
      if (editor) {
         editor.setEditable(!isDocLocked);
      }
   }, [editor, isDocLocked]);

   // Export Word handler
   function sanitizeFilename(name: string) {
      // Remove invalid filename characters and trim
      return (
         name
            .replace(/[^a-zA-Z0-9-_\s]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^[-\s]+|[-\s]+$/g, "")
            .substring(0, 64) || "export-document"
      );
   }
   function handleExport() {
      if (!editor) return;
      let progress = 0;
      const progressInterval = setInterval(() => {
         progress += 10;
         if (progress <= 100) {
            showProgressToast(progress, "Exporting Word document...");
         }
      }, 100);
      try {
         const filename = `${sanitizeFilename(docTitle)}.docx`;
         editor.commands.exportToWord(filename);
         clearInterval(progressInterval);
         hideProgressToast();
         showToast("Word document exported!", "success");
      } catch {
         clearInterval(progressInterval);
         hideProgressToast();
         showToast("Failed to export Word document.", "error");
      }
   }

   // Import Word logic
   const triggerFileInput = () => fileInput.current?.click();
   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
         showToast("File size exceeds 10MB limit.", "error");
         return;
      }
      await importWord(file);
   };
   async function filerImage(html: string) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const images = doc.querySelectorAll("img");
      if (images.length === 0) {
         return doc.body.innerHTML;
      }
      if (hasImageExtension(editor)) {
         // Optionally, handle image upload logic here
         // For now, just return the HTML
         return doc.body.innerHTML;
      }
      showToast("Image extension not found, unable to convert image.", "error");
      return doc.body.innerHTML;
   }
   async function importWord(importFile: File) {
      setLoading(true);
      try {
         const mammoth = await import("mammoth");
         const arrayBuffer = await importFile.arrayBuffer();
         const { value } = await mammoth.convertToHtml({ arrayBuffer });
         const html = await filerImage(value);
         editor.chain().setContent(html, true).run();
         showToast("Word document imported successfully.", "success");
      } catch (err) {
         showToast("Failed to import Word document.", "error");
      } finally {
         setLoading(false);
      }
   }
   // Clear handler
   function handleClear() {
      editor.commands.clearContent();
      setShowClearDialog(false);
   }

   return (
      <div className="flex w-full items-center justify-between gap-2 px-2">
         {/* Left: Remaining characters */}
         <span className={`font-mono text-xs ${isLimit ? "font-bold text-red-600" : "text-muted-foreground"}`}>{remaining}</span>
         {/* Center: Dynamic word/char count */}
         <span className="select-none hidden lg:block text-center font-mono text-xs text-muted-foreground">
            {used} | {words} words
         </span>
         {/* Right: ToolbarSection for actions, plus Clear/Lock as standalone */}
         <div className="flex flex-shrink-0 items-center gap-2">
            <ToolbarSection
               editor={editor}
               actions={sectionSixActions}
               activeActions={activeActions}
               // Show all actions if wide, else fallback to previous logic
               mainActionCount={isWide ? sectionSixActions.length : 4}
               dropdownTooltip="More actions"
               dropdownClassName="w-8"
               disabled={!docId}
            />
            {/* Hidden file input for import */}
            <input
               type="file"
               accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
               className="hidden"
               ref={fileInput}
               onChange={handleFileChange}
            />

            {/* Version History Dialog (controlled by ToolbarSection action) */}
            <VersionHistoryDialog open={openVersionHistoryDialog} setOpen={setOpenVersionHistoryDialog} />
            {/* Share Dialog (controlled by ToolbarSection action) */}
            {/* <ShareDocButton /> Removed: now handled by ToolbarSection */}
            {/* Clear Editor */}
            {/* <ActionButton ... /> Removed: now handled by ToolbarSection */}
         </div>
         <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Clear Editor</DialogTitle>
                  <DialogDescription>Are you sure you want to clear the editor?</DialogDescription>
               </DialogHeader>
               <DialogFooter>
                  <button
                     type="button"
                     className="rounded bg-muted px-4 py-2 text-foreground hover:bg-accent"
                     onClick={() => setShowClearDialog(false)}
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     className="rounded bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/80"
                     onClick={handleClear}
                  >
                     Clear
                  </button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
};

function hasImageExtension(editor: Editor) {
   return !!editor.extensionManager.extensions.find((ext) => ext.name === "image");
}

SectionSix.displayName = "SectionSix";

export default SectionSix;
