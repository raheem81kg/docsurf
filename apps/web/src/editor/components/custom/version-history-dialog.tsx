/**
 * VersionHistoryDialog.tsx
 *
 * A dialog for viewing, restoring, and clearing document versions.
 * Provides version history navigation and content preview.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@docsurf/ui/components/dialog";
import { Button } from "@docsurf/ui/components/button";
import { ScrollArea } from "@docsurf/ui/components/scroll-area";
import { format } from "date-fns";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useLiveQuery } from "dexie-react-hooks";
import { getDocVersions, createDocVersion, deleteDocVersions } from "@/lib/persist/queries";
import { Dialog as UIDialog, DialogContent as UIDialogContent, DialogTitle as UIDialogTitle } from "@docsurf/ui/components/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { RotateCcwIcon, AlertTriangleIcon, SaveIcon } from "lucide-react";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTitle, DrawerClose } from "@docsurf/ui/components/drawer";
import { useHotkeys } from "react-hotkeys-hook";
import { EditorContent } from "@tiptap/react";
// import { useTiptapEditor } from "@/app/(main)/doc/tip/tap/components/minimal-tiptap/hooks/use-tiptap-editor";
import { useEditorRefStore } from "@/store/use-editor-ref-store";
import type { DocVersion } from "@/lib/persist/dexie-persist";
import type { Editor } from "@tiptap/react";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import { useReadonlyTiptapEditor } from "../minimal-tiptap/hooks/use-readonly-tiptap";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";

export interface VersionHistoryDialogProps {
   open: boolean;
   setOpen: (open: boolean) => void;
}

const EMPTY_TIPTAP_CONTENT = { type: "doc", content: [] };

function useVersionListNavigation(
   versions: any[],
   selectedId: string | null,
   setSelectedId: (id: string) => void,
   enabled: boolean,
   isMobile: boolean
) {
   const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
   const navRef = useRef<HTMLDivElement | null>(null);

   const selectedIndex = versions.findIndex((v) => v.id === selectedId);

   useEffect(() => {
      if (focusedIndex === null || !navRef.current) return;
      const item = navRef.current.querySelector<HTMLElement>(`[data-nav-index="${focusedIndex}"]`);
      if (item) item.focus();
   }, [focusedIndex]);

   useEffect(() => {
      if (focusedIndex !== null && versions[focusedIndex] && enabled && !isMobile) {
         setSelectedId(versions[focusedIndex].id);
      }
   }, [focusedIndex, versions, setSelectedId, enabled, isMobile]);

   const handleArrowUp = React.useCallback(
      (event?: KeyboardEvent) => {
         if (!enabled || isMobile) return;
         event?.preventDefault();
         setFocusedIndex((prev) => {
            if (prev === null) return versions.length - 1;
            return prev > 0 ? prev - 1 : versions.length - 1;
         });
      },
      [versions.length, enabled, isMobile]
   );

   const handleArrowDown = React.useCallback(
      (event?: KeyboardEvent) => {
         if (!enabled || isMobile) return;
         event?.preventDefault();
         setFocusedIndex((prev) => {
            if (prev === null) return 0;
            return prev < versions.length - 1 ? prev + 1 : 0;
         });
      },
      [versions.length, enabled, isMobile]
   );

   const handleEnter = React.useCallback(
      (event?: KeyboardEvent) => {
         if (!enabled || isMobile) return;
         event?.preventDefault();
         if (focusedIndex !== null && versions[focusedIndex]) {
            setSelectedId(versions[focusedIndex].id);
            setFocusedIndex(focusedIndex);
         }
      },
      [focusedIndex, versions, setSelectedId, enabled, isMobile]
   );

   const handleEscape = React.useCallback(
      (event?: KeyboardEvent) => {
         if (!enabled || isMobile) return;
         event?.preventDefault();
         setFocusedIndex(null);
         if (navRef.current) (navRef.current as HTMLElement).blur();
      },
      [enabled, isMobile]
   );

   useHotkeys("ArrowUp", handleArrowUp, { enableOnFormTags: true, enabled: enabled && !isMobile });
   useHotkeys("ArrowDown", handleArrowDown, { enableOnFormTags: true, enabled: enabled && !isMobile });
   useHotkeys("Enter", handleEnter, { enableOnFormTags: true, enabled: enabled && !isMobile });
   useHotkeys("Escape", handleEscape, { enableOnFormTags: true, enabled: enabled && !isMobile });

   useEffect(() => {
      if (!enabled || isMobile) setFocusedIndex(null);
   }, [enabled, isMobile]);

   return { focusedIndex, setFocusedIndex, navRef };
}

type ConfirmDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   title: string;
   description: string;
   confirmText: string;
   onConfirm: () => void;
   isDestructive?: boolean;
   isLoading?: boolean;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
   open,
   onOpenChange,
   title,
   description,
   confirmText,
   onConfirm,
   isDestructive = false,
   isLoading = false,
}) => {
   return (
      <UIDialog open={open} onOpenChange={onOpenChange}>
         <UIDialogContent className="rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="text-yellow-500 size-5" aria-hidden="true" />
                  <UIDialogTitle className="text-lg font-bold">{title}</UIDialogTitle>
               </div>
               <div
                  className="bg-muted/40 border border-muted rounded px-4 py-3 text-sm text-muted-foreground flex items-center gap-2"
                  aria-live="polite"
               >
                  {description}
               </div>
               <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-2">
                  <Button variant="secondary" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
                     Cancel
                  </Button>
                  <Button
                     variant={isDestructive ? "destructive" : "default"}
                     onClick={onConfirm}
                     disabled={isLoading}
                     className="flex-1 sm:flex-initial"
                  >
                     {confirmText}
                  </Button>
               </div>
            </div>
         </UIDialogContent>
      </UIDialog>
   );
};

// Memoized version item component
const VersionItem = React.memo(
   ({
      v,
      isActive,
      isFocused,
      onClick,
      onFocus,
   }: {
      v: DocVersion;
      isActive: boolean;
      isFocused: boolean;
      onClick: () => void;
      onFocus: () => void;
   }) => (
      <button
         className={[
            "flex items-center justify-between rounded px-2 py-1 text-xs transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/60 focus:z-10",
            isActive ? "bg-accent text-accent-foreground font-semibold" : "hover:bg-muted text-muted-foreground",
            isFocused && !isActive ? "ring-2 ring-primary outline-none" : "",
         ].join(" ")}
         type="button"
         onClick={onClick}
         tabIndex={isFocused ? 0 : -1}
         data-nav-index={v.id}
         aria-label={`Select version from ${format(new Date(v.timestamp), "yyyy-MM-dd HH:mm")}`}
         style={{ minHeight: 40 }}
         onFocus={onFocus}
      >
         <span className="flex-grow min-w-0 truncate text-left">{format(new Date(v.timestamp), "MMM do, yyyy HH:mm")}</span>
         <span className="ml-2 flex items-center gap-1 flex-shrink-0">
            {/* <BookmarkIcon className="size-3.5" aria-label="Version" /> */}
            {/* <span className="text-[10px] text-muted-foreground">{format(new Date(v.timestamp), "HH:mm:ss")}</span> */}
         </span>
      </button>
   ),
   (prev, next) => prev.isActive === next.isActive && prev.isFocused === next.isFocused
);

const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({ open, setOpen }) => {
   const { data: user, isLoading: userLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc } = useCurrentDocument(user);
   const docId = doc?._id;
   const [isSaving, setIsSaving] = useState(false);
   const liveVersions = useLiveQuery(() => (docId ? getDocVersions(docId) : Promise.resolve([])), [docId], []);
   const [restoring, setRestoring] = useState<string | null>(null);
   const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
   const [showRestoreDialog, setShowRestoreDialog] = useState(false);
   const [pendingRestoreVersion, setPendingRestoreVersion] = useState<(typeof liveVersions)[0] | null>(null);
   const isMobile = useIsMobile();
   const [drawerOpen, setDrawerOpen] = useState(false);
   const [drawerVersion, setDrawerVersion] = useState<(typeof liveVersions)[0] | null>(null);
   const [confirmingRestore, setConfirmingRestore] = useState(false);
   const drawerContentRef = useRef<HTMLDivElement>(null);
   const mainEditor = useEditorRefStore.getState().editor;
   const [showClearDialog, setShowClearDialog] = useState(false);
   const [confirmingClear, setConfirmingClear] = useState(false);

   const { focusedIndex, setFocusedIndex, navRef } = useVersionListNavigation(
      liveVersions,
      selectedVersionId,
      setSelectedVersionId,
      !isMobile && open,
      isMobile
   );

   useEffect(() => {
      if (liveVersions.length > 0 && !selectedVersionId && liveVersions[0]) {
         setSelectedVersionId(liveVersions[0].id);
      }
   }, [liveVersions, selectedVersionId]);

   const selectedVersion = liveVersions.find((v) => v.id === selectedVersionId) || liveVersions[0];

   const getWordCount = (editor: Editor | null): number => {
      if (!editor) return 0;
      const text = editor.getText();
      return text.trim() ? text.trim().split(/\s+/).length : 0;
   };

   // const getLiveEditorContent = () => {
   //    if (tiptapEditor) {
   //       try {
   //          return JSON.stringify(tiptapEditor.getJSON());
   //       } catch {
   //          // fallback to store
   //       }
   //    }
   //    return docStoreDoc?.content ? JSON.stringify(docStoreDoc.content) : JSON.stringify(EMPTY_TIPTAP_CONTENT);
   // };

   // Memoize version content parsing
   const parseVersionContent = useCallback((content: string | any) => {
      try {
         return typeof content === "string" ? JSON.parse(content) : content;
      } catch (error) {
         console.error("Failed to parse version content:", error);
         return EMPTY_TIPTAP_CONTENT;
      }
   }, []);

   // Memoize version comparison
   const areVersionsEqual = useCallback((content1: any, content2: any) => {
      try {
         return JSON.stringify(content1) === JSON.stringify(content2);
      } catch (error) {
         console.error("Failed to compare versions:", error);
         return false;
      }
   }, []);

   // Memoize version list
   const versionList = useMemo(() => {
      return liveVersions.map((v, idx) => {
         const isActive = v.id === selectedVersionId;
         const isFocused = focusedIndex === idx;
         return (
            <VersionItem
               key={v.id}
               v={v}
               isActive={isActive}
               isFocused={isFocused}
               onClick={() => setSelectedVersionId(v.id)}
               onFocus={() => setFocusedIndex(idx)}
            />
         );
      });
   }, [liveVersions, selectedVersionId, focusedIndex]);

   // Update version selection to handle race conditions
   useEffect(() => {
      if (!liveVersions?.length) return;

      // If selected version no longer exists, select the latest
      const versionExists = liveVersions.some((v) => v.id === selectedVersionId);
      if (!versionExists && selectedVersionId) {
         const latestVersion = liveVersions[0];
         setSelectedVersionId(latestVersion?.id ?? null);
      }
   }, [liveVersions, selectedVersionId]);

   // Update drawer version content parsing
   const drawerVersionContent = drawerVersion?.content ? parseVersionContent(drawerVersion.content) : EMPTY_TIPTAP_CONTENT;

   // Update selected version content parsing
   const selectedVersionContent = selectedVersion?.content ? parseVersionContent(selectedVersion.content) : EMPTY_TIPTAP_CONTENT;

   const drawerTiptapEditor = useReadonlyTiptapEditor({
      value: drawerVersionContent,
      editable: false,
      editorClassName: "border-none shadow-none bg-transparent focus:outline-none px-1 py-2.5",
   });

   const selectedTiptapEditor = useReadonlyTiptapEditor({
      value: selectedVersionContent,
      editable: false,
      editorClassName: "border-none shadow-none bg-transparent  focus:outline-none px-8 py-4",
   });

   useEffect(() => {
      if (
         drawerTiptapEditor?.commands &&
         drawerTiptapEditor.isDestroyed === false &&
         typeof drawerTiptapEditor.commands.setContent === "function" &&
         drawerVersionContent
      ) {
         drawerTiptapEditor.commands.setContent(drawerVersionContent, false);
      }
   }, [drawerTiptapEditor, drawerVersionContent]);

   useEffect(() => {
      if (
         selectedTiptapEditor?.commands &&
         selectedTiptapEditor.isDestroyed === false &&
         typeof selectedTiptapEditor.commands.setContent === "function" &&
         selectedVersionContent
      ) {
         selectedTiptapEditor.commands.setContent(selectedVersionContent, false);
      }
   }, [selectedTiptapEditor, selectedVersionContent]);

   // Cleanup effect for editor instances - moved to the end
   useEffect(() => {
      return () => {
         if (drawerTiptapEditor && !drawerTiptapEditor.isDestroyed) {
            drawerTiptapEditor.destroy();
         }
         if (selectedTiptapEditor && !selectedTiptapEditor.isDestroyed) {
            selectedTiptapEditor.destroy();
         }
      };
   }, [drawerTiptapEditor, selectedTiptapEditor]);

   // Improved version restoration with validation
   const handleRestoreClick = useCallback(
      (version: DocVersion) => {
         if (!mainEditor) {
            showToast("Editor not available", "error");
            return;
         }

         try {
            const currentContent = mainEditor.getJSON();
            const versionContent = parseVersionContent(version.content);

            // Validate version content
            if (!versionContent || typeof versionContent !== "object") {
               throw new Error("Invalid version content");
            }

            if (areVersionsEqual(currentContent, versionContent)) {
               showToast("You are already viewing this version.", "success");
               return;
            }

            const stillExists = liveVersions.some((v) => v.id === version.id);
            if (!stillExists) {
               showToast("This version no longer exists.", "error");
               if (selectedVersionId === version.id) {
                  const fallback = liveVersions[0]?.id ?? null;
                  setSelectedVersionId(fallback);
               }
               return;
            }

            if (isMobile) {
               setDrawerVersion(version);
               setConfirmingRestore(true);
            } else {
               setPendingRestoreVersion(version);
               setShowRestoreDialog(true);
            }
         } catch (error) {
            console.error("Error in handleRestoreClick:", error);
            showToast("Failed to process version", "error");
         }
      },
      [mainEditor, liveVersions, selectedVersionId, isMobile, parseVersionContent, areVersionsEqual]
   );

   // Improved mobile restore with validation
   const handleMobileRestore = useCallback(async () => {
      if (!drawerVersion || !docId || !mainEditor) {
         setDrawerOpen(false);
         return;
      }

      // If not confirming yet, just set confirming state and return
      if (!confirmingRestore) {
         setConfirmingRestore(true);
         return;
      }

      try {
         const currentContent = mainEditor.getJSON();
         const versionContent = parseVersionContent(drawerVersion.content);

         // Validate version content
         if (!versionContent || typeof versionContent !== "object") {
            throw new Error("Invalid version content");
         }

         if (areVersionsEqual(currentContent, versionContent)) {
            showToast("You are already viewing this version.", "success");
            setConfirmingRestore(false);
            setDrawerOpen(false);
            setOpen(false);
            return;
         }

         setRestoring(drawerVersion.id);

         // Update the editor content directly, deferred to avoid flushSync warning
         setTimeout(() => {
            mainEditor.commands.setContent(versionContent, false);
         }, 0);

         showToast("Version restored.", "success");
         setConfirmingRestore(false);
         setDrawerOpen(false);
         setOpen(false);
      } catch (error) {
         console.error("Failed to restore version:", error);
         showToast("Failed to restore version", "error");
         setConfirmingRestore(false);
      } finally {
         setRestoring(null);
         setDrawerVersion(null);
      }
   }, [drawerVersion, docId, mainEditor, confirmingRestore, parseVersionContent, areVersionsEqual, setOpen]);

   // Update click-away handler with proper cleanup
   useEffect(() => {
      if (!confirmingRestore && !confirmingClear) return;

      let isSubscribed = true;

      function handleClick(e: MouseEvent) {
         if (!isSubscribed) return;

         const target = e.target as HTMLElement;
         const restoreButton = document.querySelector('[aria-label="Confirm restore"]');
         const clearButton = document.querySelector('[aria-label="Confirm clear all versions"]');

         // If click is outside both buttons, reset both states
         if (restoreButton && !restoreButton.contains(target)) {
            setConfirmingRestore(false);
         }
         if (clearButton && !clearButton.contains(target)) {
            setConfirmingClear(false);
         }
      }

      document.addEventListener("mousedown", handleClick);
      return () => {
         isSubscribed = false;
         document.removeEventListener("mousedown", handleClick);
      };
   }, [confirmingRestore, confirmingClear]);

   // Add cleanup for drawer state
   useEffect(() => {
      if (!drawerOpen) {
         setConfirmingRestore(false);
         setDrawerVersion(null);
      }
   }, [drawerOpen]);

   // Add cleanup for dialog state
   useEffect(() => {
      if (!open) {
         setConfirmingRestore(false);
         setConfirmingClear(false);
         setPendingRestoreVersion(null);
         setDrawerVersion(null);
         setSelectedVersionId(null); // Reset selected version when dialog closes
      } else if (liveVersions?.length > 0) {
         // Set initial version when dialog opens
         setSelectedVersionId(liveVersions[0]?.id ?? null);
      }
   }, [open, liveVersions]);

   const handleManualSave = async () => {
      if (!docId || !mainEditor) {
         showToast("Editor not available", "error");
         return;
      }

      setIsSaving(true);
      try {
         const content = mainEditor.getJSON();
         const wordCount = getWordCount(mainEditor);
         if (wordCount <= 1) {
            showToast("Cannot save version with no content", "error");
            return;
         }
         // Check if the last version is the same as the current content
         const lastVersion = liveVersions && liveVersions.length > 0 ? liveVersions[0] : null;
         if (lastVersion) {
            const lastContent = parseVersionContent(lastVersion.content);
            if (areVersionsEqual(content, lastContent)) {
               showToast("No changes since last version.", "warning");
               return;
            }
         }
         await createDocVersion(docId, content, "manual", 0, 0, wordCount);
         showToast("Version saved successfully", "success");
      } catch (error) {
         console.error("Failed to save version:", error);
         showToast("Failed to save version", "error");
      } finally {
         setIsSaving(false);
      }
   };

   const handleClearVersions = async () => {
      if (!docId) return;
      try {
         await deleteDocVersions(docId);
         setSelectedVersionId(null);
         showToast("All versions cleared", "success");
         setConfirmingClear(false);
      } catch (error) {
         console.error("Failed to clear versions:", error);
         showToast("Failed to clear versions", "error");
      }
   };

   const handleConfirmRestore = async () => {
      if (!pendingRestoreVersion || !docId || !mainEditor) return;

      const currentContent = mainEditor.getJSON();
      const versionContent = parseVersionContent(pendingRestoreVersion.content);

      if (areVersionsEqual(currentContent, versionContent)) {
         showToast("You are already viewing this version.", "success");
         setShowRestoreDialog(false);
         setOpen(false);
         return;
      }

      setRestoring(pendingRestoreVersion.id);
      setShowRestoreDialog(false);

      try {
         // Apply the version content directly to the editor, deferred to avoid flushSync warning
         setTimeout(() => {
            mainEditor.commands.setContent(versionContent, false);
         }, 0);
         showToast("Version restored.", "success");
         setOpen(false);
      } catch (error) {
         console.error("Failed to restore version:", error);
         showToast("Failed to restore version", "error");
      } finally {
         setRestoring(null);
         setPendingRestoreVersion(null);
      }
   };

   const handleMobileVersionClick = (v: DocVersion) => {
      setDrawerVersion(v);
      setSelectedVersionId(v.id);
      setDrawerOpen(true);
   };

   if (!liveVersions) {
      return <div className="p-8 text-center text-muted-foreground">Loading version history...</div>;
   }

   if (isMobile) {
      return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 flex flex-col h-[80vh] max-h-[90vh] w-full sm:max-w-[93vw] overflow-hidden">
               <VisuallyHidden>
                  <DialogTitle>Version History</DialogTitle>
               </VisuallyHidden>
               <div className="flex flex-1 min-h-0 flex-col">
                  <aside className="w-full border-r border-r-border/40  flex flex-col min-h-0 h-full overflow-x-auto">
                     <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex flex-col gap-0.5">
                           <h2 className="font-semibold text-base">Versions</h2>
                           <span className="text-xs text-muted-foreground">
                              {liveVersions.length}/{20} (oldest pruned after 20)
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Tooltip disableHoverableContent>
                              <TooltipTrigger asChild>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Save version manually"
                                    title="Save version manually"
                                    onClick={handleManualSave}
                                    disabled={isSaving}
                                 >
                                    <SaveIcon className="w-4 h-4" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent>Save version manually</TooltipContent>
                           </Tooltip>
                           <Tooltip disableHoverableContent>
                              <TooltipTrigger asChild>
                                 <Button
                                    variant={confirmingClear ? "destructive" : "default"}
                                    size="icon"
                                    className={[
                                       "size-7 mr-8 transition-colors",
                                       confirmingClear ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "",
                                    ].join(" ")}
                                    onClick={() => {
                                       if (!confirmingClear) {
                                          setConfirmingClear(true);
                                          return;
                                       }
                                       handleClearVersions();
                                    }}
                                    aria-label={confirmingClear ? "Confirm clear all versions" : "Clear all versions"}
                                 >
                                    {confirmingClear ? (
                                       <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none">
                                          <path
                                             fill="currentColor"
                                             d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                                          />
                                       </svg>
                                    ) : (
                                       <>
                                          <span className="sr-only">Clear All</span>
                                          <span role="img" aria-label="trash">
                                             🗑️
                                          </span>
                                       </>
                                    )}
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent>Clear all versions</TooltipContent>
                           </Tooltip>
                        </div>
                     </div>
                     <ScrollArea className="flex-1 min-h-0">
                        <nav className="flex flex-col gap-1 p-2">
                           {liveVersions.length === 0 ? (
                              <div className="text-sm text-muted-foreground px-2 py-4">No versions found for this document.</div>
                           ) : (
                              liveVersions.map((v) => (
                                 <button
                                    key={v.id}
                                    type="button"
                                    className={[
                                       "flex items-center justify-between rounded px-2 py-1 text-xs transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/60 focus:z-10",
                                       v.id === selectedVersionId
                                          ? "bg-accent text-accent-foreground font-semibold"
                                          : "hover:bg-muted text-muted-foreground",
                                    ].join(" ")}
                                    onClick={() => handleMobileVersionClick(v)}
                                    tabIndex={0}
                                    aria-label={`Select version from ${format(new Date(v.timestamp), "yyyy-MM-dd HH:mm")}`}
                                    style={{ minHeight: 40 }}
                                 >
                                    <span className="flex-grow min-w-0 truncate text-left">
                                       {format(new Date(v.timestamp), "MMM do, yyyy HH:mm")}
                                    </span>
                                    <span className="ml-2 flex items-center gap-1 flex-shrink-0">
                                       {/* <BookmarkIcon className="size-3.5" aria-label="Version" /> */}
                                       {/* <span className="text-[10px] text-muted-foreground">
                                             {format(new Date(v.timestamp), "HH:mm:ss")}
                                          </span> */}
                                    </span>
                                 </button>
                              ))
                           )}
                        </nav>
                     </ScrollArea>
                     <div className="flex gap-2 p-2 border-t">
                        <DialogClose asChild>
                           <Button variant="secondary" size="sm" className="flex-1">
                              Close
                           </Button>
                        </DialogClose>
                     </div>
                  </aside>
               </div>
               <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerContent ref={drawerContentRef}>
                     <div className="sticky top-0 z-10  border-b flex items-center justify-between px-4 py-3">
                        <div>
                           <DrawerTitle className="text-base">Version Preview</DrawerTitle>
                           <div className="text-xs text-muted-foreground">
                              {drawerVersion &&
                                 `${format(new Date(drawerVersion.timestamp), "yyyy-MM-dd HH:mm:ss")} · ${drawerVersion.saveReason}`}
                           </div>
                        </div>
                        <Button
                           variant={confirmingRestore ? "destructive" : "default"}
                           size="sm"
                           className={[
                              "flex items-center gap-1 transition-colors",
                              confirmingRestore ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "",
                           ].join(" ")}
                           onClick={handleMobileRestore}
                           aria-label={confirmingRestore ? "Confirm restore" : "Restore this version"}
                           disabled={isSaving || restoring === (drawerVersion?.id ?? null)}
                           aria-live="polite"
                        >
                           {confirmingRestore ? (
                              <span className="flex items-center text-xs">
                                 <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none" className="mr-1">
                                    <path
                                       fill="currentColor"
                                       d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                                    />
                                 </svg>
                                 Confirm Restore
                              </span>
                           ) : (
                              <>
                                 <RotateCcwIcon className="size-3.5" />
                                 Restore
                              </>
                           )}
                        </Button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-1.5" style={{ maxHeight: "60vh" }}>
                        <div className=" border rounded shadow-sm px-1 py-3">
                           <EditorContent
                              editor={drawerTiptapEditor}
                              style={{
                                 scrollbarWidth: "thin",
                                 scrollbarColor: "var(--border) transparent",
                              }}
                              className="focus:outline-none px-4 py-0"
                           />
                        </div>
                     </div>
                     <div className="flex gap-2 p-4 border-t">
                        <DrawerClose asChild>
                           <Button variant="secondary" size="sm" className="flex-1">
                              Cancel
                           </Button>
                        </DrawerClose>
                     </div>
                  </DrawerContent>
               </Drawer>
            </DialogContent>
         </Dialog>
      );
   }

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogContent className="p-0 flex flex-col h-[950px] max-h-[90vh] w-full lg:max-w-[80vw] sm:max-w-[93vw] overflow-hidden">
            <VisuallyHidden>
               <DialogTitle>Version History</DialogTitle>
            </VisuallyHidden>
            <div className="flex flex-1 min-h-0 items-stretch flex-col md:flex-row">
               <aside className="w-full md:w-56 border-r border-r-border/40  flex flex-col min-h-0 md:h-auto h-40 overflow-x-auto md:overflow-x-visible">
                  <div className="flex items-center justify-between px-4 py-3">
                     <div className="flex flex-col gap-0.5">
                        <h2 className="font-semibold text-base">Versions</h2>
                        <span className="text-xs text-muted-foreground">
                           {liveVersions.length}/{20} (oldest pruned after 20)
                        </span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Tooltip disableHoverableContent>
                           <TooltipTrigger asChild>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 aria-label="Save version manually"
                                 title="Save version manually"
                                 onClick={handleManualSave}
                                 disabled={isSaving}
                              >
                                 <SaveIcon className="w-4 h-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Save version manually</TooltipContent>
                        </Tooltip>
                        <Tooltip disableHoverableContent>
                           <TooltipTrigger asChild>
                              <Button variant="destructive" size="icon" className="size-7" onClick={() => setShowClearDialog(true)}>
                                 <span className="sr-only">Clear All</span>🗑️
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Clear all versions</TooltipContent>
                        </Tooltip>
                     </div>
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                     <nav className="flex flex-col gap-1 p-2" ref={navRef} aria-label="Version list">
                        {liveVersions.length === 0 ? (
                           <div className="text-sm text-muted-foreground px-2 py-4">No versions found for this document.</div>
                        ) : (
                           versionList
                        )}
                     </nav>
                  </ScrollArea>
                  <div className="flex gap-2 p-2 border-t">
                     <DialogClose asChild>
                        <Button variant="secondary" size="sm" className="flex-1">
                           Close
                        </Button>
                     </DialogClose>
                  </div>
               </aside>
               <section className="flex-1 flex flex-col min-h-0 bg-muted/40 border-t md:border-t-0 md:border-l border-border/40">
                  {selectedVersion && (
                     <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between px-4 pt-2 pb-2 border-b /80">
                           <div className="py-1.5">
                              <div className="text-xs text-muted-foreground mb-0.5">
                                 {doc?.title ?? DEFAULT_TEXT_TITLE} · {selectedVersion.saveReason}
                              </div>
                              <h3 className="font-semibold text-base leading-tight">Version Preview</h3>
                           </div>
                           <Tooltip disableHoverableContent>
                              <TooltipTrigger asChild>
                                 <Button
                                    size="sm"
                                    variant="default"
                                    className="flex items-center gap-1 mr-8"
                                    disabled={restoring === selectedVersion.id || isSaving}
                                    onClick={() => handleRestoreClick(selectedVersion)}
                                    aria-label="Restore this version"
                                 >
                                    <RotateCcwIcon className="size-3.5" />
                                    {restoring === selectedVersion.id ? "Restoring..." : "Restore"}
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restore this version</TooltipContent>
                           </Tooltip>
                        </div>
                        <div className="p-w flex-1 min-h-0 h-full overflow-auto flex flex-col ">
                           <EditorContent
                              style={{
                                 scrollbarWidth: "thin",
                                 scrollbarColor: "var(--border) transparent",
                              }}
                              editor={selectedTiptapEditor}
                              className="minimal-tiptap-editor min-h-full"
                           />
                        </div>
                     </div>
                  )}
               </section>
            </div>
         </DialogContent>
         <ConfirmDialog
            open={showRestoreDialog}
            onOpenChange={setShowRestoreDialog}
            title="Restore Version?"
            description="Are you sure you want to restore this version? This will replace your current content."
            confirmText="Restore"
            onConfirm={handleConfirmRestore}
            isDestructive
            isLoading={restoring !== null}
         />
         {!isMobile && (
            <ConfirmDialog
               open={showClearDialog}
               onOpenChange={setShowClearDialog}
               title="Clear All Versions?"
               description="Are you sure you want to clear all versions? This action cannot be undone."
               confirmText="Clear All"
               onConfirm={handleClearVersions}
               isDestructive
            />
         )}
      </Dialog>
   );
};

export default React.memo(VersionHistoryDialog);
