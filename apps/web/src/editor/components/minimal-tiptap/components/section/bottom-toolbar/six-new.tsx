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
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useSession } from "@/hooks/auth-hooks";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { isToday, isYesterday } from "date-fns";
import { useDocumentSettings, FONT_OPTIONS } from "@/store/document-settings-store";
import { Switch } from "@docsurf/ui/components/switch";
import { ArrowLeftRight } from "lucide-react";

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

   // Use useEditorState for undo/redo state and character/word counts
   const { canUndo, canRedo, characterCount, wordCount } = useEditorState({
      editor,
      selector: (ctx) => {
         const text = ctx.editor.getText();
         return {
            canUndo: ctx.editor.can().undo(),
            canRedo: ctx.editor.can().redo(),
            characterCount: [...new Intl.Segmenter().segment(text)].length,
            wordCount: text.split(/\s+/).filter((word) => word !== "").length,
         };
      },
   });

   const [loading, setLoading] = React.useState(false);
   const fileInput = React.useRef<HTMLInputElement>(null);
   const used = characterCount ?? 0;
   const words = wordCount ?? 0;
   const remaining = characterLimit - used;
   const isLimit = used >= characterLimit;
   const [showClearDialog, setShowClearDialog] = React.useState(false);
   const [openVersionHistoryDialog, setOpenVersionHistoryDialog] = React.useState(false);

   // Get current document for updatedAt
   const { data: session, isPending: sessionLoading } = useSession();
   const { data: user } = useQuery({
      ...convexQuery(api.auth.getCurrentUser, {}),
      enabled: !!session?.user,
   });
   const currentDocument = useCurrentDocument(user);
   const updatedAt = currentDocument?.doc?.updatedAt;

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
      if (isDocLocked) return; // Prevent import when locked
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

   // Font state for dropdown
   const defaultFont = useDocumentSettings((s) => s.defaultFont);
   const setDefaultFont = useDocumentSettings((s) => s.setDefaultFont);
   const fullWidth = useDocumentSettings((s) => s.fullWidth);
   const setFullWidth = useDocumentSettings((s) => s.setFullWidth);

   // Add nFormatter for formatting large numbers like 500K, 1M, etc.
   function nFormatter(num?: number, opts: { digits?: number; full?: boolean } = { digits: 1 }) {
      if (!num) return "0";
      if (opts.full) {
         return Intl.NumberFormat("en-US").format(num);
      }
      const rx = /\.0+ |\.[0-9]*[1-9]0+$/;
      if (num < 1) {
         return num.toFixed(opts.digits).replace(rx, "$1");
      }
      const lookup = [
         { value: 1, symbol: "" },
         { value: 1e3, symbol: "K" },
         { value: 1e6, symbol: "M" },
         { value: 1e9, symbol: "G" },
         { value: 1e12, symbol: "T" },
         { value: 1e15, symbol: "P" },
         { value: 1e18, symbol: "E" },
      ];
      var item = lookup
         .slice()
         .reverse()
         .find((item) => num >= item.value);
      return item ? (num / item.value).toFixed(opts.digits).replace(rx, "$1") + item.symbol : "0";
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

            <BlockDropdown editor={editor} isDocLocked={isDocLocked} />
            <Separator orientation="vertical" className="min-h-7 min-w-[1px]" />
            <SectionFive editor={editor} disabled={isDocLocked} />
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
               {/* Font selection row */}
               <div className="flex flex-col gap-1 px-1 pb-1">
                  <div className="flex justify-between gap-1">
                     {FONT_OPTIONS.map((option) => {
                        const isActive = defaultFont === option.value;
                        return (
                           <button
                              key={option.value}
                              type="button"
                              aria-label={option.label}
                              tabIndex={0}
                              className={
                                 "flex flex-col items-center min-w-[38px] justify-end rounded transition-colors cursor-pointer px-1 py-1 " +
                                 (isActive ? "bg-accent text-primary" : "hover:bg-accent/30")
                              }
                              style={{ userSelect: "none" }}
                              onClick={() => setDefaultFont(option.value)}
                           >
                              <span
                                 className={option.className + " text-[22px] pb-1.5"}
                                 style={
                                    (option.value === "sans"
                                       ? { height: 22 }
                                       : option.value === "mono"
                                       ? { letterSpacing: -1, height: 22 }
                                       : { height: 22 }) as React.CSSProperties
                                 }
                              >
                                 Ag
                              </span>
                              <span
                                 className="text-[12px] leading-4 mt-1 whitespace-nowrap overflow-hidden text-ellipsis"
                                 style={{ color: isActive ? "#2383e2" : undefined }}
                              >
                                 {option.previewLabel}
                              </span>
                           </button>
                        );
                     })}
                  </div>
               </div>
               {/* Full width toggle row */}
               <div className="flex items-center justify-between gap-2 px-2 py-1 mt-1 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                     <ArrowLeftRight className="size-4 text-muted-foreground" />
                     <span className="text-sm ">Full width</span>
                  </div>
                  <Switch checked={fullWidth} onCheckedChange={setFullWidth} aria-label="Toggle full width" />
               </div>
               {/* Lock editor toggle row */}
               <div className="flex items-center justify-between gap-2 px-2 py-1 mt-1 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                     {isDocLocked ? (
                        <UnlockIcon className="size-4 text-muted-foreground" />
                     ) : (
                        <LockIcon className="size-4 text-muted-foreground" />
                     )}
                     <span className="text-sm ">Lock editor</span>
                  </div>
                  <Switch
                     checked={!!isDocLocked}
                     onCheckedChange={toggleLock}
                     aria-label="Toggle lock editor"
                     disabled={!!loadingDoc}
                  />
               </div>
               <DropdownMenuItem onClick={() => setOpenShareDialog(true)}>
                  <SendIcon className="size-4 mr-1.5" />
                  Share
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => handleExport()}>
                  <DownloadIcon className="size-4 mr-1.5" />
                  Export as Word
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => triggerFileInput()} disabled={isDocLocked}>
                  <FileUpIcon className="size-4 mr-1.5" />
                  Import Word
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setOpenVersionHistoryDialog(true)}>
                  <ClockRewind size={16} />
                  <span className="ml-1.5">Version History</span>
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowClearDialog(true)} disabled={isDocLocked}>
                  <Trash2Icon className="size-4 mr-1.5" />
                  Clear Editor
               </DropdownMenuItem>
               {/* Word count and last updated info */}
               {remaining > 0 && (
                  <div className="border-t p-2">
                     <p className="text-xs text-muted-foreground mb-1">Remaining: {nFormatter(remaining)} characters</p>
                  </div>
               )}
               {(words > 0 || updatedAt) && (
                  <div className="border-t p-2">
                     {<p className="text-xs text-muted-foreground mb-1">Word count: {words.toLocaleString()} words</p>}
                     {updatedAt && (
                        <p className="text-xs text-muted-foreground">
                           Last edited{" "}
                           {(() => {
                              const date = new Date(updatedAt);
                              if (isToday(date)) {
                                 return `today at ${date.toLocaleTimeString(undefined, {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                 })}`;
                              }
                              if (isYesterday(date)) {
                                 return `yesterday at ${date.toLocaleTimeString(undefined, {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                 })}`;
                              }
                              return date.toLocaleString(undefined, {
                                 year: "numeric",
                                 month: "short",
                                 day: "numeric",
                                 hour: "numeric",
                                 minute: "2-digit",
                                 hour12: true,
                              });
                           })()}
                        </p>
                     )}
                  </div>
               )}
            </DropdownMenuContent>
         </DropdownMenu>

         {/* Version History Dialog (controlled by ToolbarSection action) */}
         <VersionHistoryDialog open={openVersionHistoryDialog} setOpen={setOpenVersionHistoryDialog} />
         {/* Share Dialog (controlled by ToolbarSection action) */}
         <ShareDocButton open={openShareDialog} onOpenChange={setOpenShareDialog} />

         {/* Clear Editor Dialog */}
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
