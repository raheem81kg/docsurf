// CODE IS FRAGILE, IDEK HOW IT MADE THE SUGGESTION OVERLAY WORK AND RESIZE PROPERLY

import { BubbleMenu } from "@tiptap/react";
import type { BubbleMenuProps } from "@tiptap/react";
import { WandSparkles, MessageSquarePlus } from "lucide-react";
import { ToolbarButton } from "../minimal-tiptap/components/toolbar-button";
import { TooltipProvider } from "@docsurf/ui/components/tooltip";
import { useSuggestionOverlay } from "@/editor/components/providers/suggestion-overlay/suggestion-overlay-provider";
import { useEditorState } from "@tiptap/react";
import deepEql from "fast-deep-equal";
import { isTextSelected } from "@/utils/is-text-selected";
import { isCustomNodeSelected } from "@/utils/is-custom-node-selected";
import * as React from "react";
import { cn } from "@docsurf/ui/lib/utils";
import SuggestionOverlay from "@/editor/components/providers/suggestion-overlay/suggestion-overlay";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";

export type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children"> & {
   appendTo?: React.RefObject<any>;
};

export function TextBubbleMenu(props: EditorBubbleMenuProps) {
   const { editor, appendTo, className } = props;
   const {
      isOpen: isSuggestionOverlayOpen,
      isOpen,
      closeSuggestionOverlay,
      tryOpenSuggestionOverlayFromEditorSelection,
   } = useSuggestionOverlay();
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc } = useCurrentDocument(user);
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces">;
   const { isParagraphActive, isHeadingActive } = useTextMenuState(editor);
   const shouldShowButton = Boolean(isParagraphActive) || Boolean(isHeadingActive);
   const isActive = Boolean(
      useEditorState({
         editor,
         selector: () => isOpen,
      })
   );

   if (!editor) return null;

   // Updated BubbleMenu props with advanced shouldShow logic and overlay check
   const bubbleMenuProps: EditorBubbleMenuProps = {
      ...props,
      ...(appendTo ? { appendTo: appendTo.current } : {}),
      pluginKey: "text-menu",
      shouldShow: ({ editor, from, view }) => {
         if (isSuggestionOverlayOpen) return false;
         if (!view || editor.view.dragging) return false;

         const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
         const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
         const node = nodeDOM || domAtPos;

         if (isCustomNodeSelected(editor, node) || !editor.isEditable) return false;

         // Only exclude table as a nested node
         const isTableSelected = editor.isActive("table") && node?.classList?.contains("ProseMirror-selectednode");

         return isTextSelected(editor) && !isTableSelected;
      },
      tippyOptions: {
         popperOptions: {
            placement: "top-start",
            modifiers: [
               { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
               { name: "flip", options: { fallbackPlacements: ["bottom-start", "top-end", "bottom-end"] } },
            ],
         },
         maxWidth: "100%",
      },
   };

   function handleAiButtonClick(e: React.MouseEvent) {
      e.preventDefault();
      if (isOpen) {
         closeSuggestionOverlay();
      } else {
         tryOpenSuggestionOverlayFromEditorSelection();
      }
   }

   return (
      <BubbleMenu
         {...bubbleMenuProps}
         className={cn("bg-background flex gap-0 rounded-lg border shadow-md overflow-hidden", className)}
      >
         {isSuggestionOverlayOpen && doc?._id && workspaceId ? (
            <></>
         ) : (
            // <SuggestionOverlay
            //    documentId={doc._id}
            //    workspaceId={workspaceId}
            //    isOpen={isSuggestionOverlayOpen}
            //    onClose={closeSuggestionOverlay}
            //    selectedText={undefined}
            //    position={undefined}
            //    onAcceptSuggestion={() => {}}
            //    editor={editor}
            //    from={undefined}
            //    to={undefined}
            // />
            <button
               className="focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:select-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs border-border/50 gap-1.5 rounded-r-none border-r"
               data-state="closed"
               onClick={handleAiButtonClick}
               type="button"
            >
               <WandSparkles className="size-3.5" />
               <span className="text-xs">Transform</span>
            </button>
         )}
         {/* TODO: Add to Chat handler */}
         {/* <div className="flex">
            <button
               className="focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:select-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs gap-1.5 rounded-l-none"
               data-state="closed"
               onClick={() => { */}
         {/* TODO: Add to Chat handler */}
         {/* }}
               type="button"
            >
               <MessageSquarePlus className="size-3.5" />
               <span className="text-xs">Add to Chat</span>
            </button> */}
         {/* </div> */}
      </BubbleMenu>
   );
}

// --- Hook: useTextMenuState ---
import type { Editor } from "@tiptap/react";

const DEFAULT_TEXT_COLOR = "#374151";

export const useTextMenuState = (editor: Editor | null) => {
   const states = useEditorState({
      editor,
      selector: (ctx) => {
         if (!ctx.editor) return {};
         return {
            currentTextColor: ctx.editor.getAttributes("textStyle").color || DEFAULT_TEXT_COLOR,
            linkUrl: ctx.editor?.getAttributes("link").href,
            textAlign: ctx.editor?.isActive({ textAlign: "left" })
               ? "left"
               : ctx.editor?.isActive({ textAlign: "center" })
               ? "center"
               : ctx.editor?.isActive({ textAlign: "right" })
               ? "right"
               : ctx.editor?.isActive({ textAlign: "justify" })
               ? "justify"
               : "left",
            isListActive: ctx.editor.isActive("bulletList") || ctx.editor.isActive("orderedList"),
            isUrlVariable: ctx.editor.getAttributes("link").isUrlVariable ?? false,
            isHeadingActive: ctx.editor.isActive("heading"),
            headingShowIfKey: ctx.editor.getAttributes("heading")?.showIfKey || "",
            isParagraphActive: ctx.editor.isActive("paragraph"),
            paragraphShowIfKey: ctx.editor.getAttributes("paragraph")?.showIfKey || "",
         };
      },
      equalityFn: deepEql,
   });
   return states ?? {};
};
