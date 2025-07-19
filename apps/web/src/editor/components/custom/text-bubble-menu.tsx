// CODE IS FRAGILE, IDEK HOW IT MADE THE SUGGESTION OVERLAY WORK AND RESIZE PROPERLY

import { BubbleMenu } from "@tiptap/react";
import type { BubbleMenuProps } from "@tiptap/react";
import {
   WandSparkles,
   MessageSquarePlus,
   Bold,
   Italic,
   Underline,
   Strikethrough,
   Code,
   Radical,
   Link,
   ChevronDown,
   Ellipsis,
   Type,
} from "lucide-react";
import { ToolbarButton } from "../minimal-tiptap/components/toolbar-button";
import { TooltipProvider } from "@docsurf/ui/components/tooltip";
import { useSuggestionOverlayStore } from "@/store/use-suggestion-overlay-store";
import { useUIVisibilityStore } from "@/store/use-ui-visibility-store";
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
import { Separator } from "@docsurf/ui/components/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@docsurf/ui/components/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@docsurf/ui/components/popover";
import { ToggleGroup, ToggleGroupItem } from "@docsurf/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";

export type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children"> & {
   appendTo?: React.RefObject<any>;
};

export function TextBubbleMenu(props: EditorBubbleMenuProps) {
   const { editor, appendTo, className } = props;
   const { isOpen, closeSuggestionOverlay, tryOpenSuggestionOverlayFromEditorSelection } = useSuggestionOverlayStore();
   const shouldShowTextBubbleMenu = useUIVisibilityStore((state) => state.shouldShowTextBubbleMenu);
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
         if (isOpen) return false;
         if (!shouldShowTextBubbleMenu()) return false;
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
         tryOpenSuggestionOverlayFromEditorSelection(editor);
      }
   }

   return (
      <BubbleMenu
         {...bubbleMenuProps}
         className={cn("flex gap-0 overflow-hidden rounded-lg border bg-background shadow-md", className)}
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
                  <span className="text-xs">Transform</span>
               </button>

               <Separator orientation="vertical" className="mx-1.5 h-6" />

               {/* Comment and Edit Section */}
               <div className="flex items-center gap-0.5">
                  <ToolbarButton
                     tooltip="Comment"
                     aria-label="Add comment"
                     className="h-8 w-8 p-0"
                     onClick={() => {
                        // TODO: Implement comment functionality
                        console.log("Comment clicked");
                     }}
                  >
                     <MessageSquarePlus className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                     tooltip="Edit"
                     aria-label="Edit"
                     className="h-8 w-8 p-0"
                     onClick={() => {
                        // TODO: Implement edit functionality
                        console.log("Edit clicked");
                     }}
                  >
                     <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                     </svg>
                  </ToolbarButton>
               </div>

               <Separator orientation="vertical" className="mx-1.5 h-6" />

               {/* Text Formatting Section */}
               <div className="flex items-center gap-0.5">
                  {/* Text Style Dropdown */}
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <ToolbarButton
                           tooltip="Text styles"
                           aria-label="Text styles"
                           className="h-8 px-2 gap-1"
                           onClick={() => {
                              // TODO: Implement text style dropdown
                              console.log("Text style dropdown clicked");
                           }}
                        >
                           <Type className="size-4" />
                           <ChevronDown className="size-3.5" />
                        </ToolbarButton>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start" className="w-48">
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

                  {/* Bold */}
                  <ToolbarButton
                     tooltip="Bold (Ctrl+B)"
                     aria-label="Bold"
                     className="h-8 w-8 p-0"
                     isActive={editor.isActive("bold")}
                     onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                     <Bold className="size-4" />
                  </ToolbarButton>

                  {/* Italic */}
                  <ToolbarButton
                     tooltip="Italic (Ctrl+I)"
                     aria-label="Italic"
                     className="h-8 w-8 p-0"
                     isActive={editor.isActive("italic")}
                     onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                     <Italic className="size-4" />
                  </ToolbarButton>

                  {/* Underline */}
                  <ToolbarButton
                     tooltip="Underline (Ctrl+U)"
                     aria-label="Underline"
                     className="h-8 w-8 p-0"
                     isActive={editor.isActive("underline")}
                     onClick={() => editor.chain().focus().toggleUnderline().run()}
                  >
                     <Underline className="size-4" />
                  </ToolbarButton>

                  {/* Strikethrough */}
                  <ToolbarButton
                     tooltip="Strikethrough"
                     aria-label="Strikethrough"
                     className="h-8 w-8 p-0"
                     isActive={editor.isActive("strike")}
                     onClick={() => editor.chain().focus().toggleStrike().run()}
                  >
                     <Strikethrough className="size-4" />
                  </ToolbarButton>

                  {/* Code */}
                  <ToolbarButton
                     tooltip="Code"
                     aria-label="Code"
                     className="h-8 w-8 p-0"
                     isActive={editor.isActive("code")}
                     onClick={() => editor.chain().focus().toggleCode().run()}
                  >
                     <Code className="size-4" />
                  </ToolbarButton>

                  {/* Radical */}
                  <ToolbarButton
                     tooltip="Radical"
                     aria-label="Radical"
                     className="h-8 w-8 p-0"
                     onClick={() => {
                        // TODO: Implement radical functionality
                        console.log("Radical clicked");
                     }}
                  >
                     <Radical className="size-4" />
                  </ToolbarButton>

                  {/* Link */}
                  <ToolbarButton
                     tooltip="Link"
                     aria-label="Link"
                     className="h-8 w-8 p-0"
                     isActive={editor.isActive("link")}
                     onClick={() => {
                        // TODO: Implement link functionality
                        console.log("Link clicked");
                     }}
                  >
                     <Link className="size-4" />
                  </ToolbarButton>
               </div>

               <Separator orientation="vertical" className="mx-1.5 h-6" />

               {/* Color Picker */}
               <Popover>
                  <PopoverTrigger asChild>
                     <ToolbarButton tooltip="Text color" aria-label="Text color" className="h-8 px-2 gap-1">
                        <div
                           className="size-4 rounded-full"
                           style={{
                              background:
                                 "linear-gradient(120deg, rgb(110, 182, 242) 20%, rgb(168, 85, 247), rgb(234, 88, 12), rgb(234, 179, 8) 80%)",
                           }}
                        />
                        <ChevronDown className="size-3.5" />
                     </ToolbarButton>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-48 p-2">
                     <div className="grid grid-cols-7 gap-1">
                        {/* Default colors - simplified for now */}
                        {[
                           "#000000",
                           "#ffffff",
                           "#ff0000",
                           "#00ff00",
                           "#0000ff",
                           "#ffff00",
                           "#ff00ff",
                           "#00ffff",
                           "#ffa500",
                           "#800080",
                           "#008000",
                           "#ffc0cb",
                           "#a52a2a",
                           "#808080",
                           "#000080",
                        ].map((color, index) => (
                           <button
                              key={index}
                              type="button"
                              className="size-6 rounded border border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                 // TODO: Implement color selection
                                 console.log("Color selected:", color);
                              }}
                              aria-label={`Select color ${color}`}
                           />
                        ))}
                     </div>
                  </PopoverContent>
               </Popover>

               <Separator orientation="vertical" className="mx-1.5 h-6" />

               {/* More Options */}
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <ToolbarButton tooltip="More options" aria-label="More options" className="h-8 w-8 p-0">
                        <Ellipsis className="size-4" />
                     </ToolbarButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                     <DropdownMenuItem
                        onClick={() => {
                           // TODO: Implement clear formatting
                           console.log("Clear formatting clicked");
                        }}
                     >
                        Clear formatting
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        onClick={() => {
                           // TODO: Implement subscript
                           console.log("Subscript clicked");
                        }}
                     >
                        Subscript
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        onClick={() => {
                           // TODO: Implement superscript
                           console.log("Superscript clicked");
                        }}
                     >
                        Superscript
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        onClick={() => {
                           // TODO: Implement highlight
                           console.log("Highlight clicked");
                        }}
                     >
                        Highlight
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </>
         )}
      </BubbleMenu>
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
            linkUrl: editor?.getAttributes("link").href,
            textAlign: editor?.isActive({ textAlign: "left" })
               ? "left"
               : editor?.isActive({ textAlign: "center" })
               ? "center"
               : editor?.isActive({ textAlign: "right" })
               ? "right"
               : editor?.isActive({ textAlign: "justify" })
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
