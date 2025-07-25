"use client";
import * as React from "react";
import type { Content, Editor } from "@tiptap/react";
import type { UseMinimalTiptapEditorProps } from "../minimal-tiptap/hooks/use-minimal-tiptap";
import { EditorContent } from "@tiptap/react";
import { cn } from "@docsurf/ui/lib/utils";
import { LinkBubbleMenu } from "../minimal-tiptap/components/bubble-menu/link-bubble-menu";
import { useMinimalTiptapEditor } from "../minimal-tiptap/hooks/use-minimal-tiptap";
import { SectionSix } from "../minimal-tiptap/components/section/six";
import { MAX_CHARACTERS, getComparableContent } from "../minimal-tiptap/tiptap-util";
import { TableBubbleMenu } from "../minimal-tiptap/components/bubble-menu/table-bubble-menu";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { useBreakpoint } from "@docsurf/ui/hooks/use-breakpoint";
import { ScrollArea, ScrollBar } from "@docsurf/ui/components/scroll-area";
import Locked from "./ui/locked";
import Deleted from "./ui/deleted";
import { useEditorRefStore } from "@/store/use-editor-ref-store";
import { useSandStateStore } from "@/store/sandstate";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { SearchAndReplaceToolbar } from "./search-and-replace-toolbar";
import { AnimatePresence } from "motion/react";
import { useMutation } from "convex/react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { useSession } from "@/hooks/auth-hooks";
import { ContentMenu } from "./content-menu";
import { EditorMenuBar } from "./editor-menu-bar";
import { TextBubbleMenu } from "./text-bubble-menu";
import { isEqual } from "lodash-es";
import { useDocumentSettings } from "@/store/document-settings-store";
import SectionSixNew from "../minimal-tiptap/components/section/bottom-toolbar/six-new";
import { SectionZero } from "../minimal-tiptap/components/section/zero";
import SectionOne from "../minimal-tiptap/components/section/one";

export interface MinimalTiptapProps extends Omit<UseMinimalTiptapEditorProps, "onUpdate"> {
   value?: Content;
   onChange?: (value: Content) => void;
   className?: string;
   editorContentClassName?: string;
   characterLimit?: number;
   isMainEditor: boolean;
   hideContextMenu?: boolean;
   hasMenuBar?: boolean;
}

interface BottomToolbarProps {
   editor: Editor;
   docId: string;
   docTitle?: string;
   characterLimit?: number;
   isDocLocked: boolean;
   toggleLock?: () => void;
   isBelowMobile?: boolean;
}

const BottomToolbarNew = ({
   editor,
   docId,
   docTitle,
   characterLimit = MAX_CHARACTERS,
   isDocLocked,
   toggleLock,
   isBelowMobile,
}: BottomToolbarProps) => (
   <ScrollArea
      className={
         isBelowMobile
            ? "shrink-0 overflow-x-auto border-t border-border p-2 min-h-12 md:min-h-10"
            : "shrink-0 overflow-x-auto border-t border-border p-1"
      }
      style={isBelowMobile ? { paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
   >
      <SectionSixNew
         editor={editor}
         docId={docId}
         docTitle={docTitle}
         characterLimit={characterLimit}
         isDocLocked={isDocLocked}
         toggleLock={toggleLock}
      />
      <ScrollBar orientation="horizontal" />
   </ScrollArea>
);

const TopToolbar = ({ editor, isDocLocked }: { editor: Editor; isDocLocked?: boolean }) => {
   const { l_sidebar_state, ir_sidebar_state } = useSandStateStore();
   const isEitherSidebarOpen = l_sidebar_state || ir_sidebar_state;

   return (
      <div className="flex w-max items-center gap-px px-2 py-1">
         <SectionOne editor={editor} isDocLocked={isDocLocked} />
      </div>
   );
};

// Simple sync logic - just update editor when value prop changes and differs from current content

export const MinimalTiptap = React.forwardRef<HTMLDivElement, MinimalTiptapProps>(
   (
      {
         value,
         onChange,
         className,
         editorContentClassName,
         characterLimit = MAX_CHARACTERS,
         hideContextMenu = false,
         hasMenuBar = false,
         ...props
      },
      ref
   ) => {
      const { data: session, isPending } = useSession();
      const isUserNotSignedIn = !session?.user && !isPending;
      const isMobile = useIsMobile();
      const isBelowMobile = useBreakpoint(640);
      const { l_sidebar_state, ir_sidebar_state } = useSandStateStore();
      const isMobileSidebarOpen = isBelowMobile && (l_sidebar_state || ir_sidebar_state);
      // Get user and workspaceId
      const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
      const { doc } = useCurrentDocument(user);
      const defaultFont = useDocumentSettings((s) => s.defaultFont);

      const editor = useMinimalTiptapEditor({
         value,
         enableVersionTracking: false,
         onUpdate: onChange,
         characterLimit,
         // Performance optimizations from TipTap 2.5+
         immediatelyRender: true,
         shouldRerenderOnTransaction: false,
         ...props,
      });

      const toggleDocumentLock = useMutation(api.documents.toggleDocumentLock);
      const handleToggleLock = React.useCallback(async () => {
         if (!doc?._id || !doc.workspaceId || isUserNotSignedIn) return;
         try {
            await toggleDocumentLock({
               workspaceId: doc.workspaceId,
               id: doc._id,
            });
         } catch (err) {
            showToast("Failed to toggle lock", "error");
            console.error("Failed to toggle lock", err);
         }
      }, [doc, toggleDocumentLock, isUserNotSignedIn]);

      // Register the editor instance in the global store
      React.useEffect(() => {
         useEditorRefStore.getState().setEditor(editor ?? null);
         return () => {
            useEditorRefStore.getState().setEditor(null);
         };
      }, [editor]);

      // Hide drag handle when sidebar states change
      React.useEffect(() => {
         if (editor && (editor as any).hideDragHandle) {
            (editor as any).hideDragHandle();
         }
      }, [l_sidebar_state, ir_sidebar_state, editor]);

      // Track last user input time for conflict detection
      const lastInputTime = React.useRef<number>(0);
      const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

      // Track user input to detect active typing
      React.useEffect(() => {
         if (!editor) return;

         const updateInputTime = () => {
            lastInputTime.current = Date.now();
         };

         editor.on("update", updateInputTime);
         return () => {
            editor.off("update", updateInputTime);
         };
      }, [editor]);

      // Improved sync: preserve cursor position and handle conflicts
      React.useEffect(() => {
         if (!editor || !props.isMainEditor || isUserNotSignedIn) return;

         const currentContent = editor.getJSON();
         const incomingContent = value;

         // Use robust content comparison instead of JSON.stringify
         const currentComparable = getComparableContent(currentContent);
         const incomingComparable = getComparableContent(incomingContent);
         const contentsDiffer = !isEqual(currentComparable, incomingComparable);

         // Check if editor has pending changes (actively saving)
         const hasPendingChanges = (editor as any).hasPendingChanges?.current;

         // Only update if content actually differs and we're not in the middle of saving
         if (contentsDiffer && !hasPendingChanges) {
            // Clear any pending sync
            if (syncTimeoutRef.current) {
               clearTimeout(syncTimeoutRef.current);
            }

            const performSync = () => {
               if (!editor) return;

               // Double-check we're not saving before syncing
               const currentPendingChanges = (editor as any).hasPendingChanges?.current;
               if (currentPendingChanges) return;

               // Preserve cursor position and selection
               const { selection } = editor.state;
               const { from, to } = selection;
               const wasFocused = editor.isFocused;

               // Update content
               editor.commands.setContent(incomingContent || "", false);
               console.log("synced");

               // Restore cursor position if possible and editor was focused
               if (wasFocused) {
                  try {
                     // Only restore selection if positions are still valid
                     const docSize = editor.state.doc.content.size;
                     if (from <= docSize && to <= docSize) {
                        editor.commands.setTextSelection({ from, to });
                     } else {
                        // If position is invalid, focus at end of document
                        editor.commands.focus();
                        editor.commands.selectTextblockEnd();
                     }
                  } catch {
                     // If selection restoration fails, just focus
                     editor.commands.focus();
                  }
               }
            };

            // Check if user is actively typing
            const FOCUSED_SYNC_DELAY = 3000; // 3 seconds
            const timeSinceLastInput = Date.now() - lastInputTime.current;

            if (timeSinceLastInput < FOCUSED_SYNC_DELAY && editor.isFocused) {
               // User is actively typing, delay sync to avoid interruption
               syncTimeoutRef.current = setTimeout(() => {
                  // Only sync if editor is no longer focused or enough time has passed
                  if (!editor.isFocused || Date.now() - lastInputTime.current >= FOCUSED_SYNC_DELAY) {
                     performSync();
                  }
               }, FOCUSED_SYNC_DELAY);
            } else {
               // Safe to sync immediately
               performSync();
            }
         }

         // Cleanup timeout on unmount
         return () => {
            if (syncTimeoutRef.current) {
               clearTimeout(syncTimeoutRef.current);
            }
         };
      }, [editor, value, props.isMainEditor, isUserNotSignedIn]);

      // Search & Replace hotkey logic
      const [showSearchReplace, setShowSearchReplace] = React.useState(false);
      React.useEffect(() => {
         const handler = (e: KeyboardEvent) => {
            // Cmd+F (Mac) or Ctrl+F (Win/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
               e.preventDefault();
               setShowSearchReplace((v) => !v);
            }
         };
         const closeHandler = () => setShowSearchReplace(false);
         window.addEventListener("keydown", handler);
         window.addEventListener("closeSearchReplacePanel", closeHandler);
         return () => {
            window.removeEventListener("keydown", handler);
            window.removeEventListener("closeSearchReplacePanel", closeHandler);
         };
      }, []);
      if (!editor) {
         return null;
      }
      return (
         <div ref={ref} className={cn("flex flex-col h-full min-h-0 relative", className)}>
            {/* Only show Locked if locked and not deleted */}
            {doc?.isLocked && !doc?.isDeleted && <Locked />}
            <Deleted />
            <AnimatePresence>{showSearchReplace && <SearchAndReplaceToolbar editor={editor} />}</AnimatePresence>

            {!(doc?.isDeleted || doc?.isLocked) && !isUserNotSignedIn && import.meta.env.DEV && (
               <div className="sticky top-0 z-10 shrink-0 overflow-x-auto border-b border-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <TopToolbar editor={editor} isDocLocked={doc?.isLocked ?? false} />
               </div>
            )}
            <div className="flex-1 min-h-0 overflow-auto flex flex-col h-full">
               <EditorContent
                  style={{
                     scrollbarWidth: "thin",
                     scrollbarColor: "var(--border) transparent",
                  }}
                  editor={editor}
                  className={cn(
                     "minimal-tiptap-editor min-h-full",
                     editorContentClassName,
                     defaultFont === "sans" && "font-sans",
                     defaultFont === "serif" && "font-serif",
                     defaultFont === "mono" && "font-mono",
                     defaultFont === "lato" && "font-lato"
                  )}
               />
            </div>

            {hasMenuBar && <EditorMenuBar editor={editor} />}

            {/* Wrap BubbleMenus in a div to avoid unmount errors (see https://github.com/ueberdosis/tiptap/issues/2658) */}
            {/* <FloatingMenu /> */}
            <div>
               <TextBubbleMenu editor={editor} className={isMobileSidebarOpen ? "hidden" : ""} />
               {!hideContextMenu && <ContentMenu editor={editor} className={isBelowMobile ? "hidden" : ""} />}
               <LinkBubbleMenu editor={editor} />
               <TableBubbleMenu editor={editor} />
            </div>
            <div className="z-10 sticky bottom-0" style={isBelowMobile ? { paddingBottom: "env(safe-area-inset-bottom)" } : undefined}>
               <BottomToolbarNew
                  editor={editor}
                  docId={doc?._id ?? ""}
                  docTitle={doc?.title ?? ""}
                  characterLimit={characterLimit}
                  isDocLocked={doc?.isLocked ?? false}
                  toggleLock={handleToggleLock}
                  isBelowMobile={isBelowMobile}
               />
            </div>
         </div>
      );
   }
);

MinimalTiptap.displayName = "MinimalTiptap";

export default MinimalTiptap;
