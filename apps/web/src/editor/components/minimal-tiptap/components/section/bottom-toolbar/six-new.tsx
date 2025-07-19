import * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { MAX_CHARACTERS } from "../../../tiptap-util";
import { ActionButton } from "../../../extensions/image/components/image-actions";
import {
   FileUpIcon,
   DownloadIcon,
   LockIcon,
   UnlockIcon,
   Trash2Icon,
   SendIcon,
   MoreHorizontalIcon,
   MicIcon,
   Table2Icon,
   UndoIcon,
   RedoIcon,
   Undo2Icon,
   Redo2Icon,
   MoreVerticalIcon,
} from "lucide-react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { showProgressToast, hideProgressToast } from "@docsurf/ui/components/_c/toast/progressToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@docsurf/ui/components/dialog";
import { cn } from "@docsurf/ui/lib/utils";
import { ClockRewind } from "@/editor/components/custom/ui/diffview/lib/icons";
import VersionHistoryDialog from "@/editor/components/custom/version-history-dialog";
import { ShareDocButton } from "@/editor/components/custom/share-doc-button";
import { ToolbarSection } from "../../toolbar-section";
import type { FormatAction } from "../../../types";
import { useBreakpoint } from "@docsurf/ui/hooks/use-breakpoint";
import { Separator } from "@docsurf/ui/components/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@docsurf/ui/components/dropdown-menu";
import ToolbarButton from "../../toolbar-button";
import BlockDropdown from "./block-dropdown";
import { SectionFive } from "../five";

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

export const SectionSixNew: React.FC<SectionSixProps> = ({
   editor,
   docId,
   docTitle = "",
   characterLimit = MAX_CHARACTERS,
   isDocLocked,
   loadingDoc,
   toggleLock,
   activeActions = ["share", "exportWord", "importWord", "versionHistory", "lockEditor", "clearEditor"],
}) => {
   // Undo
   function handleUndo() {
      if (canUndo) editor.chain().focus().undo().run();
   }

   // Redo
   function handleRedo() {
      if (canRedo) editor.chain().focus().redo().run();
   }

   // Flip logic: isWide is true when window.innerWidth >= 1324
   const isWide = !useBreakpoint(1300);
   const { characterCount, wordCount, canUndo, canRedo } = useEditorState({
      editor,
      selector: ({ editor }: { editor: Editor }) => {
         return {
            characterCount: editor.storage.characterCount.characters(),
            wordCount: editor.storage.characterCount.words(),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
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
      <div className="flex w-full items-center justify-between">
         {/* Left: Empty space for balance */}
         <div className="w-[0.1px]" />

         {/* Center: Two buttons with separator */}
         <div className="flex items-center gap-2 md:gap-1.5">
            {/* <button
               type="button"
               onClick={() => setOpenVersionHistoryDialog(true)}
               className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
               <MicIcon size={16} />
            </button>
            <Separator orientation="vertical" className="min-h-7 min-w-[1px]" /> */}
            <BlockDropdown editor={editor} />
            <Separator orientation="vertical" className="min-h-7 min-w-[1px]" />
            <SectionFive editor={editor} />
            <Separator orientation="vertical" className="min-h-7 min-w-[1px]" />
            <ToolbarButton
               onClick={handleUndo}
               disabled={!canUndo || isDocLocked}
               tooltip="Undo (Ctrl+Z)"
               aria-label="Undo"
               size="sm"
               variant="outline"
               disableHoverableContent
            >
               <Undo2Icon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
               onClick={handleRedo}
               disabled={!canRedo || isDocLocked}
               tooltip="Redo (Ctrl+Shift+Z)"
               aria-label="Redo"
               size="sm"
               variant="outline"
               disableHoverableContent
            >
               <Redo2Icon className="size-4" />
            </ToolbarButton>
         </div>

         {/* Right: Dropdown menu */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <ToolbarButton
                  tooltip="More"
                  aria-label="More"
                  size="sm"
                  variant="outline"
                  disableHoverableContent
                  type="button"
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
               >
                  <MoreVerticalIcon className="size-4" />
               </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
               <DropdownMenuItem onClick={() => setOpenShareDialog(true)}>
                  <SendIcon className="size-4 mr-2" />
                  Share
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => handleExport()}>
                  <DownloadIcon className="size-4 mr-2" />
                  Export as Word
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => triggerFileInput()}>
                  <FileUpIcon className="size-4 mr-2" />
                  Import Word
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                  <Trash2Icon className="size-4 mr-2" />
                  Clear Editor
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>

         {/* Version History Dialog (controlled by ToolbarSection action) */}
         <VersionHistoryDialog open={openVersionHistoryDialog} setOpen={setOpenVersionHistoryDialog} />
         {/* Share Dialog (controlled by ToolbarSection action) */}
         <ShareDocButton open={openShareDialog} onOpenChange={setOpenShareDialog} />

         {/* Hidden file input for import */}
         <input ref={fileInput} type="file" accept=".docx,.doc" onChange={handleFileChange} className="hidden" />
      </div>
   );
};

function hasImageExtension(editor: Editor) {
   return !!editor.extensionManager.extensions.find((ext) => ext.name === "image");
}

SectionSixNew.displayName = "SectionSixNew";

export default SectionSixNew;
