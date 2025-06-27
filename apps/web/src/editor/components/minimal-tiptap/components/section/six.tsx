import * as React from "react";
import type { Editor } from "@tiptap/react";
import { MAX_CHARACTERS } from "../../tiptap-util";
import { ActionButton } from "../../extensions/image/components/image-actions";
import { FileUpIcon, DownloadIcon, LockIcon, UnlockIcon, Trash2Icon } from "lucide-react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { showProgressToast, hideProgressToast } from "@docsurf/ui/components/_c/toast/progressToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@docsurf/ui/components/dialog";
import { cn } from "@docsurf/ui/lib/utils";

/**
 * SectionSix displays character/word count and formatting actions in the bottom toolbar.
 * - Left: Remaining characters (turns red if limit reached)
 * - Center: Fixed text '30 | 3 words'
 * - Right: SectionTwo (formatting actions)
 */
export interface SectionSixProps {
   editor: Editor;
   characterLimit?: number;
   isDocLocked?: boolean;
   loadingDoc?: boolean;
   toggleLock?: () => void;
}

export const SectionSix: React.FC<SectionSixProps> = ({
   editor,
   characterLimit = MAX_CHARACTERS,
   isDocLocked,
   loadingDoc,
   toggleLock,
}) => {
   const [loading, setLoading] = React.useState(false);
   const fileInput = React.useRef<HTMLInputElement>(null);
   // Use character and word counts from editor.storage.characterCount
   const used = editor.storage.characterCount?.characters?.() ?? 0;
   const words = editor.storage.characterCount?.words?.() ?? 0;
   console.log("[SectionSix] used", used);
   console.log("[SectionSix] words", words);
   const remaining = characterLimit - used;
   const isLimit = used >= characterLimit;
   const [showClearDialog, setShowClearDialog] = React.useState(false);
   const [openVersionHistoryDialog, setOpenVersionHistoryDialog] = React.useState(false);

   // Sync Tiptap's editable state with isDocLocked
   React.useEffect(() => {
      if (editor) {
         editor.setEditable(!isDocLocked);
      }
   }, [editor, isDocLocked]);

   // Export Word handler
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
         editor.commands.exportToWord();
         clearInterval(progressInterval);
         hideProgressToast();
         showToast("Word document exported!", "success");
      } catch (err) {
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
         <span className={"font-mono text-xs " + (isLimit ? "font-bold text-red-600" : "text-muted-foreground")}>{remaining}</span>
         {/* Center: Dynamic word/char count */}
         <span className="select-none hidden lg:block text-center font-mono text-xs text-muted-foreground">
            {used} | {words} words
         </span>
         {/* Right: Import/Export Word and Lock/Unlock */}
         <div className="flex flex-shrink-0 items-center gap-2">
            {/* Export Word */}
            <ActionButton
               icon={<DownloadIcon className="size-4" />}
               tooltip="Export as Word (.docx)"
               onClick={handleExport}
               disabled={isDocLocked}
            />

            {/* Import Word */}
            <ActionButton
               icon={<FileUpIcon className="size-4" />}
               tooltip={loading ? "Importing..." : "Import Word (.docx)"}
               onClick={triggerFileInput}
               disabled={loading || isDocLocked}
            />
            <input
               type="file"
               accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
               className="hidden"
               ref={fileInput}
               onChange={handleFileChange}
            />

            {/* Lock/Unlock Editor */}
            <ActionButton
               icon={isDocLocked ? <LockIcon className="size-4" /> : <UnlockIcon className="size-4" />}
               tooltip={isDocLocked ? "Unlock editor" : "Lock editor"}
               onClick={toggleLock}
               disabled={loadingDoc}
               className={cn(isDocLocked && "text-blue-500/80")}
            />

            {/* Version History Dialog Trigger and Dialog */}
            {/* <VersionHistoryDialog open={openVersionHistoryDialog} setOpen={setOpenVersionHistoryDialog} />

            <ActionButton
               icon={<ClockRewind size={16} />}
               tooltip="Show version history"
               aria-label="Show version history"
               title="Show version history"
               onClick={() => setOpenVersionHistoryDialog(true)}
               disabled={isDocLocked}
            /> */}

            {/* Clear Editor */}
            <ActionButton
               icon={<Trash2Icon className="size-4" />}
               tooltip="Clear editor"
               onClick={() => setShowClearDialog(true)}
               disabled={isDocLocked}
            />
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
