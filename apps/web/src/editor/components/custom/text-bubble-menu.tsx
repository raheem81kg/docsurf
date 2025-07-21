// CODE IS FRAGILE, IDEK HOW IT MADE THE SUGGESTION OVERLAY WORK AND RESIZE PROPERLY

import { BubbleMenu } from "@tiptap/react";
import type { BubbleMenuProps } from "@tiptap/react";
import { WandSparkles, Bold, Italic, Underline, Strikethrough, Code, ChevronDown, Type } from "lucide-react";
import { TextNoneIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ToolbarButton } from "../minimal-tiptap/components/toolbar-button";
import { useSuggestionOverlayStore } from "@/store/use-suggestion-overlay-store";
import { useUIVisibilityStore } from "@/store/use-ui-visibility-store";
import { useEditorState } from "@tiptap/react";
import deepEql from "fast-deep-equal";
import { isTextSelected } from "@/utils/is-text-selected";
import { isCustomNodeSelected } from "@/utils/is-custom-node-selected";
import * as React from "react";
import { cn } from "@docsurf/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@docsurf/ui/components/dropdown-menu";
import type { FormatAction } from "../minimal-tiptap/types";
import { ToolbarSection } from "../minimal-tiptap/components/toolbar-section";
import { ColorPicker } from "./bubble-menu-components/color-picker";
import { AlignmentPicker } from "./bubble-menu-components/alignment-picker";
import { LinkPopover } from "./bubble-menu-components/link-popover";

export type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children"> & {
   appendTo?: React.RefObject<any>;
   className?: string;
};

export function TextBubbleMenu(props: EditorBubbleMenuProps) {
   const { editor, appendTo, className } = props;
   const { isOpen, closeSuggestionOverlay, tryOpenSuggestionOverlayFromEditorSelection } = useSuggestionOverlayStore();
   const shouldShowTextBubbleMenu = useUIVisibilityStore((state) => state.shouldShowTextBubbleMenu);
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc } = useCurrentDocument(user);
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces">;
   const { isParagraphActive, isHeadingActive } = useTextMenuState(editor || null);
   const shouldShowButton = Boolean(isParagraphActive) || Boolean(isHeadingActive);
   const isActive = Boolean(
      useEditorState({
         editor: editor || null,
         selector: () => isOpen,
      })
   );

   const editorState = useEditorState({
      editor: editor || null,
      selector: ({ editor }) => ({
         isCodeBlock: editor?.isActive("codeBlock"),
         isTableSelected: editor?.isActive("table"),
      }),
   });

   // Container ref for popovers to prevent BubbleMenu from closing
   const containerRef = React.useRef<HTMLDivElement>(null);

   if (!editor) return null;

   // Updated BubbleMenu props with advanced shouldShow logic and overlay check
   const bubbleMenuProps: EditorBubbleMenuProps = {
      ...props,
      ...(appendTo ? { appendTo: appendTo.current } : {}),
      pluginKey: "text-menu",
      shouldShow: ({ editor, from, view }) => {
         if (isOpen) return false;
         if (!shouldShowTextBubbleMenu()) return false;
         if (!view || editor.view.dragging) return false;

         const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
         const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
         const node = nodeDOM || domAtPos;

         if (isCustomNodeSelected(editor, node) || !editor.isEditable) return false;

         // Only exclude table as a nested node
         const isTableSelected = editorState?.isTableSelected && node?.classList?.contains("ProseMirror-selectednode");

         // Don't show text bubble menu if a link is active (let LinkBubbleMenu handle it)
         if (editor.isActive("link")) return false;

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
         tryOpenSuggestionOverlayFromEditorSelection(editor || null);
      }
   }

   return (
      <BubbleMenu {...bubbleMenuProps}>
         <div
            ref={containerRef}
            className={cn("flex gap-0 max-w-[90vw] overflow-x-scroll rounded-lg border bg-background shadow-md", className)}
         >
            {isOpen && doc?._id && workspaceId ? (
               <></>
            ) : (
               <>
                  {/* AI Transform Button */}
                  <button
                     className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md rounded-r-none border-border/50 border-r px-3 font-medium text-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:select-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                     data-state="closed"
                     aria-label="Transform with AI"
                     title="Transform with AI"
                     onClick={handleAiButtonClick}
                     type="button"
                  >
                     <WandSparkles className="size-3.5" />
                     <span className="text-xs">AI Edit</span>
                  </button>

                  {/* Text Formatting Section */}
                  <div className="flex items-center gap-0.5">
                     {/* Text Style Dropdown */}
                     <DropdownMenu modal={true}>
                        <DropdownMenuTrigger asChild>
                           <ToolbarButton
                              tooltip="Text styles"
                              aria-label="Text styles"
                              className="h-8 px-5.5 gap-1 rounded-l-none"
                              onClick={() => {
                                 // TODO: Implement text style dropdown
                                 console.log("Text style dropdown clicked");
                              }}
                           >
                              <Type className="size-4" />
                              <ChevronDown className="size-3.5" />
                           </ToolbarButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48" container={containerRef?.current ?? undefined}>
                           <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>Normal Text</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                              Heading 1
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                              Heading 2
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                              Heading 3
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>

                     {/* Basic Formatting Actions */}
                     <BubbleMenuFormattingActions editor={editor} />
                  </div>

                  {/* Combined Color & Highlight Picker */}
                  <ColorPicker editor={editor} containerRef={containerRef} />

                  {/* Link Popover */}
                  <LinkPopover editor={editor} disabled={editorState?.isCodeBlock ?? false} containerRef={containerRef} />

                  {/* Alignment Picker */}
                  <AlignmentPicker editor={editor} containerRef={containerRef} />

                  {/* More Options */}
                  <BubbleMenuMoreOptions editor={editor} containerRef={containerRef} />
               </>
            )}
         </div>
      </BubbleMenu>
   );
}

// --- Bubble Menu Formatting Actions Component ---
interface BubbleMenuFormattingActionsProps {
   editor: any;
}

function BubbleMenuFormattingActions({ editor }: BubbleMenuFormattingActionsProps) {
   const editorState = useEditorState({
      editor,
      selector: (context) => ({
         isCodeBlock: context.editor.isActive("codeBlock"),
         isBold: context.editor.isActive("bold"),
         isItalic: context.editor.isActive("italic"),
         isUnderline: context.editor.isActive("underline"),
         isStrike: context.editor.isActive("strike"),
         isCode: context.editor.isActive("code"),
         isLink: context.editor.isActive("link"),
      }),
   });

   const formatActions: FormatAction[] = [
      {
         value: "bold",
         label: "Bold",
         icon: <Bold className="size-4" />,
         action: (editor) => editor.chain().focus().toggleBold().run(),
         isActive: () => editorState.isBold,
         canExecute: (editor) => editor.can().chain().focus().toggleBold().run() && !editorState.isCodeBlock,
         shortcuts: [],
      },
      {
         value: "italic",
         label: "Italic",
         icon: <Italic className="size-4" />,
         action: (editor) => editor.chain().focus().toggleItalic().run(),
         isActive: () => editorState.isItalic,
         canExecute: (editor) => editor.can().chain().focus().toggleItalic().run() && !editorState.isCodeBlock,
         shortcuts: [],
      },
      {
         value: "underline",
         label: "Underline",
         icon: <Underline className="size-4" />,
         action: (editor) => editor.chain().focus().toggleUnderline().run(),
         isActive: () => editorState.isUnderline,
         canExecute: (editor) => editor.can().chain().focus().toggleUnderline().run() && !editorState.isCodeBlock,
         shortcuts: [],
      },
      {
         value: "strikethrough",
         label: "Strikethrough",
         icon: <Strikethrough className="size-4" />,
         action: (editor) => editor.chain().focus().toggleStrike().run(),
         isActive: () => editorState.isStrike,
         canExecute: (editor) => editor.can().chain().focus().toggleStrike().run() && !editorState.isCodeBlock,
         shortcuts: [],
      },
      {
         value: "code",
         label: "Code",
         icon: <Code className="size-4" />,
         action: (editor) => editor.chain().focus().toggleCode().run(),
         isActive: () => editorState.isCode,
         canExecute: (editor) => editor.can().chain().focus().toggleCode().run() && !editorState.isCodeBlock,
         shortcuts: [],
      },
      // {
      //    value: "radical",
      //    label: "Mark as equation",
      //    icon: <Radical className="size-4" />,
      //    action: (editor) => {
      //       // TODO: Implement radical functionality
      //       console.log("Radical clicked");
      //    },
      //    isActive: () => false,
      //    canExecute: (editor) => !editorState.isCodeBlock,
      //    shortcuts: [],
      // },
   ];

   return (
      <ToolbarSection
         editor={editor}
         actions={formatActions}
         activeActions={["bold", "italic", "underline", "strikethrough", "code"]}
         mainActionCount={6}
         size="sm"
         variant="outline"
         disableHoverableContent
         disabled={editorState.isCodeBlock}
      />
   );
}

// --- Bubble Menu More Options Component ---
interface BubbleMenuMoreOptionsProps {
   editor: any;
   containerRef: React.RefObject<HTMLDivElement | null>;
}

function BubbleMenuMoreOptions({ editor, containerRef }: BubbleMenuMoreOptionsProps) {
   const editorState = useEditorState({
      editor,
      selector: (context) => ({
         isCodeBlock: context.editor.isActive("codeBlock"),
         isSuperscript: context.editor.isActive("superscript"),
         isSubscript: context.editor.isActive("subscript"),
      }),
   });

   const moreOptionsActions: FormatAction[] = [
      {
         value: "clearFormatting",
         label: "Clear formatting",
         icon: <TextNoneIcon className="size-4" />,
         action: (editor) => editor.chain().focus().unsetAllMarks().run(),
         isActive: () => false,
         canExecute: (editor) => editor.can().chain().focus().unsetAllMarks().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "\\"],
      },
      {
         value: "superscript",
         label: "Superscript",
         icon: <Code className="size-4" />,
         action: (editor) => editor.chain().focus().toggleSuperscript().run(),
         isActive: () => editorState.isSuperscript,
         canExecute: (editor) => editor.can().chain().focus().toggleSuperscript().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", "."],
      },
      {
         value: "subscript",
         label: "Subscript",
         icon: <Code className="size-4" />,
         action: (editor) => editor.chain().focus().toggleSubscript().run(),
         isActive: () => editorState.isSubscript,
         canExecute: (editor) => editor.can().chain().focus().toggleSubscript().run() && !editorState.isCodeBlock,
         shortcuts: ["mod", ","],
      },
   ];

   return (
      <DropdownMenu modal={true}>
         <DropdownMenuTrigger asChild>
            <ToolbarButton
               tooltip="More formatting"
               aria-label="More formatting"
               className="!border-l !border !border-border/50 h-8 w-8 p-0"
               size="sm"
               variant="outline"
               disableHoverableContent
               disabled={editorState.isCodeBlock}
            >
               <DotsHorizontalIcon className="size-4" />
            </ToolbarButton>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" className="w-48" container={containerRef?.current ?? undefined}>
            {moreOptionsActions.map((action) => (
               <DropdownMenuItem
                  key={action.value}
                  onClick={() => action.action(editor)}
                  disabled={!action.canExecute(editor) || editorState.isCodeBlock}
                  className="flex flex-row items-center justify-between gap-4"
                  aria-label={action.label}
               >
                  <span className="flex items-center gap-2">
                     {action.icon}
                     {action.label}
                  </span>
                  {action.shortcuts.length > 0 && (
                     <span className="text-xs text-muted-foreground">
                        {action.shortcuts.map((s) => (s === "mod" ? "⌘" : s === "shift" ? "⇧" : s)).join("+")}
                     </span>
                  )}
               </DropdownMenuItem>
            ))}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

// --- Hook: useTextMenuState ---
import type { Editor } from "@tiptap/react";

const DEFAULT_TEXT_COLOR = "#374151";

export const useTextMenuState = (editor: Editor | null) => {
   const states = useEditorState({
      editor,
      selector: ({ editor }) => {
         if (!editor) return {};
         return {
            currentTextColor: editor.getAttributes("textStyle").color || DEFAULT_TEXT_COLOR,
            linkUrl: editor.getAttributes("link").href,
            textAlign: editor.isActive({ textAlign: "left" })
               ? "left"
               : editor.isActive({ textAlign: "center" })
               ? "center"
               : editor.isActive({ textAlign: "right" })
               ? "right"
               : editor.isActive({ textAlign: "justify" })
               ? "justify"
               : "left",
            isListActive: editor.isActive("bulletList") || editor.isActive("orderedList"),
            isUrlVariable: editor.getAttributes("link").isUrlVariable ?? false,
            isHeadingActive: editor.isActive("heading"),
            headingShowIfKey: editor.getAttributes("heading")?.showIfKey || "",
            isParagraphActive: editor.isActive("paragraph"),
            paragraphShowIfKey: editor.getAttributes("paragraph")?.showIfKey || "",
         };
      },
      equalityFn: deepEql,
   });
   return states ?? {};
};
