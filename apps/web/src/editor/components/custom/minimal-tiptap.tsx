"use client";
import * as React from "react";
import type { Content, Editor } from "@tiptap/react";
import type { UseMinimalTiptapEditorProps } from "../minimal-tiptap/hooks/use-minimal-tiptap";
import { EditorContent } from "@tiptap/react";
import { Separator } from "@docsurf/ui/components/separator";
import { cn } from "@docsurf/ui/lib/utils";
import { SectionOne } from "../minimal-tiptap/components/section/one";
import { SectionTwo } from "../minimal-tiptap/components/section/two";
import { SectionThree } from "../minimal-tiptap/components/section/three";
import { SectionFour } from "../minimal-tiptap/components/section/four";
import { SectionFive } from "../minimal-tiptap/components/section/five";
import { LinkBubbleMenu } from "../minimal-tiptap/components/bubble-menu/link-bubble-menu";
import { useMinimalTiptapEditor } from "../minimal-tiptap/hooks/use-minimal-tiptap";
import { SectionSix } from "../minimal-tiptap/components/section/six";
import { MAX_CHARACTERS } from "../minimal-tiptap/tiptap-util";
import { SectionZero } from "../minimal-tiptap/components/section/zero";
import { TableBubbleMenu } from "../minimal-tiptap/components/bubble-menu/table-bubble-menu";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
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
import { useThrottle } from "../minimal-tiptap/hooks/use-throttle";
import { toast } from "sonner";
import { useSession } from "@/hooks/auth-hooks";

export interface MinimalTiptapProps extends Omit<UseMinimalTiptapEditorProps, "onUpdate"> {
   value?: Content;
   onChange?: (value: Content) => void;
   className?: string;
   editorContentClassName?: string;
   characterLimit?: number;
   isMainEditor: boolean;
}

const MobileTopToolbar = ({ editor, isDocLocked }: { editor: Editor; isDocLocked?: boolean }) => (
   <div className="flex w-max items-center gap-px p-2">
      <SectionZero editor={editor} isDocLocked={isDocLocked} />
      <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
      <SectionOne editor={editor} activeLevels={[1, 2, 3, 4, 5, 6]} isDocLocked={isDocLocked} />
      <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
      <SectionTwo
         editor={editor}
         activeActions={["bold", "italic", "underline", "strikethrough", "code", "clearFormatting", "superscript", "subscript"]}
         mainActionCount={3}
         isDocLocked={isDocLocked}
      />
      <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
      <SectionThree editor={editor} isDocLocked={isDocLocked} />
      <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
      <SectionFour
         editor={editor}
         activeActions={["orderedList", "bulletList", "taskList"]}
         mainActionCount={0}
         isDocLocked={isDocLocked}
      />
      <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
      <SectionFive
         editor={editor}
         activeActions={["codeBlock", "blockquote", "horizontalRule"]}
         mainActionCount={0}
         isDocLocked={isDocLocked}
      />
   </div>
);

const TopToolbar = ({ editor, isDocLocked }: { editor: Editor; isDocLocked?: boolean }) => {
   const { l_sidebar_state, ir_sidebar_state } = useSandStateStore();
   const isEitherSidebarOpen = l_sidebar_state || ir_sidebar_state;

   return (
      <div className="flex w-max items-center gap-px px-2 py-1">
         <SectionZero editor={editor} isDocLocked={isDocLocked} />
         <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
         <SectionOne editor={editor} activeLevels={[1, 2, 3, 4]} variant="outline" isDocLocked={isDocLocked} />
         <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
         <SectionTwo
            editor={editor}
            activeActions={["italic", "bold", "underline", "code", "strikethrough", "clearFormatting", "superscript", "subscript"]}
            mainActionCount={5}
            variant="outline"
            isDocLocked={isDocLocked}
         />
         <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
         <SectionThree editor={editor} variant="outline" isDocLocked={isDocLocked} />
         <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
         <SectionFour
            editor={editor}
            activeActions={["bulletList", "orderedList", "taskList"]}
            mainActionCount={isEitherSidebarOpen ? 0 : 3}
            variant="outline"
            isDocLocked={isDocLocked}
         />
         <Separator orientation="vertical" className="mx-2 h-7 min-h-7" />
         <SectionFive
            editor={editor}
            activeActions={["blockquote", "codeBlock", "horizontalRule"]}
            mainActionCount={3}
            variant="outline"
            isDocLocked={isDocLocked}
         />
      </div>
   );
};

const BottomToolbar = ({
   editor,
   characterLimit = MAX_CHARACTERS,
   isDocLocked,
   toggleLock,
}: {
   editor: Editor;
   characterLimit?: number;
   isDocLocked: boolean;
   toggleLock?: () => void;
}) => (
   <ScrollArea className="shrink-0 overflow-x-auto border-t border-border p-2">
      <SectionSix editor={editor} characterLimit={characterLimit} isDocLocked={isDocLocked} toggleLock={toggleLock} />
      <ScrollBar orientation="horizontal" />
   </ScrollArea>
);

const TOAST_ID = "sync-server-content";

// Helper function to check if content is effectively empty
const isEffectivelyEmptyContent = (content: any): boolean => {
   if (!content) return true;
   if (typeof content === "object" && Object.keys(content).length === 0) return true;

   // Check if it's an empty Tiptap document structure
   if (content.type === "doc" && (!content.content || content.content.length === 0)) return true;

   // Check if it's just an empty paragraph
   if (
      content.type === "doc" &&
      content.content?.length === 1 &&
      content.content[0]?.type === "paragraph" &&
      (!content.content[0]?.content || content.content[0]?.content.length === 0)
   ) {
      return true;
   }

   return false;
};

export const MinimalTiptap = React.forwardRef<HTMLDivElement, MinimalTiptapProps>(
   ({ value, onChange, className, editorContentClassName, characterLimit = MAX_CHARACTERS, ...props }, ref) => {
      const { data: session, isPending } = useSession();
      const isUserNotSignedIn = !session?.user && !isPending;
      const isMobile = useIsMobile();
      // Get user and workspaceId
      const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
      const { doc } = useCurrentDocument(user);
      const pendingSyncValue = React.useRef<any>(null);

      const editor = useMinimalTiptapEditor({
         value,
         enableVersionTracking: false,
         onUpdate: onChange,
         characterLimit,
         onSave: () => toast.dismiss(TOAST_ID),
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

      console.log("[MinimalTiptap] editor", editor);
      // Register the editor instance in the global store
      React.useEffect(() => {
         useEditorRefStore.getState().setEditor(editor ?? null);
         return () => {
            useEditorRefStore.getState().setEditor(null);
         };
      }, [editor]);

      const ONE_HOUR = 60 * 60 * 1000;

      // Memoize the sync callback to avoid recreating it on every render
      const handleSync = React.useCallback(() => {
         if (pendingSyncValue.current && editor && !isUserNotSignedIn) {
            editor.commands.setContent(pendingSyncValue.current, false);
            if ((editor as any).hasPendingChanges) {
               (editor as any).hasPendingChanges.current = false;
            }
            showToast("Changes synced from server", "success", { id: TOAST_ID });
         }
      }, [editor, isUserNotSignedIn]);

      // Memoize the content comparison function
      const compareAndShowSync = React.useCallback(
         (val: any) => {
            if (editor && val && doc && !isUserNotSignedIn) {
               if ((editor as any).hasPendingChanges?.current) return;

               const current = editor.getJSON();
               const serverContent = val;

               // Check if both contents are effectively empty (avoid false positives for new documents)
               const isCurrentEmpty = isEffectivelyEmptyContent(current);
               const isServerEmpty = isEffectivelyEmptyContent(serverContent);

               if (isCurrentEmpty && isServerEmpty) {
                  // Both are empty, no sync needed
                  return;
               }

               // Only show sync warning if contents are meaningfully different
               if (JSON.stringify(current) !== JSON.stringify(serverContent)) {
                  pendingSyncValue.current = val;
                  showToast("Server content is out of sync with your local changes.", "warning", {
                     id: TOAST_ID,
                     duration: Number.POSITIVE_INFINITY,
                     action: {
                        label: "Sync Now",
                        onClick: handleSync,
                     },
                  });
               }
            }
         },
         [editor, handleSync, doc, isUserNotSignedIn]
      );

      const throttledSetContent = useThrottle(compareAndShowSync, 500);

      React.useEffect(() => {
         if (!props.isMainEditor || !doc || isUserNotSignedIn) return;
         throttledSetContent(value);
      }, [props.isMainEditor, value, throttledSetContent, doc]);

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
            {/* Hide top toolbars if deleted or locked */}
            {!(doc?.isDeleted || doc?.isLocked) && !isUserNotSignedIn && (
               <div className="sticky top-0 z-10 shrink-0 overflow-x-auto border-b border-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {isMobile ? (
                     <MobileTopToolbar editor={editor} isDocLocked={doc?.isLocked ?? false} />
                  ) : (
                     <TopToolbar editor={editor} isDocLocked={doc?.isLocked ?? false} />
                  )}
               </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto flex flex-col h-full">
               <EditorContent
                  style={{
                     scrollbarWidth: "thin",
                     scrollbarColor: "var(--border) transparent",
                  }}
                  editor={editor}
                  className={cn("minimal-tiptap-editor min-h-full", editorContentClassName)}
               />
            </div>

            {/* Wrap BubbleMenus in a div to avoid unmount errors (see https://github.com/ueberdosis/tiptap/issues/2658) */}
            <div>
               <LinkBubbleMenu editor={editor} />
               <TableBubbleMenu editor={editor} />
            </div>
            <div className="z-10 sticky bottom-0">
               <BottomToolbar
                  editor={editor}
                  characterLimit={characterLimit}
                  isDocLocked={doc?.isLocked ?? false}
                  toggleLock={handleToggleLock}
               />
            </div>
         </div>
      );
   }
);

MinimalTiptap.displayName = "MinimalTiptap";

export default MinimalTiptap;
