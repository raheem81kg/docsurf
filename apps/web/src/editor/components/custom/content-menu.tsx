import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";

import type { NodeSelection } from "@tiptap/pm/state";

import type { Node } from "@tiptap/pm/model";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@docsurf/ui/components/popover";

import { cn } from "@docsurf/ui/lib/utils";
import { DragHandle } from "../minimal-tiptap/extensions/custom/drag-handle/drag-handle";
import { BaseButton } from "./ui/base-button";
import { Divider } from "./ui/divider";
import { useUIVisibilityStore } from "@/store/use-ui-visibility-store";

export type ContentMenuProps = {
   editor: Editor;
   className?: string;
};

export function ContentMenu(props: ContentMenuProps) {
   const { editor, className } = props;

   const [menuOpen, setMenuOpen] = useState(false);
   const [currentNode, setCurrentNode] = useState<Node | null>(null);
   const [currentNodePos, setCurrentNodePos] = useState<number>(-1);
   const setContentMenuOpen = useUIVisibilityStore((state) => state.setContentMenuOpen);
   const setAnyMenuOpen = useUIVisibilityStore((state) => state.setAnyMenuOpen);

   const handleNodeChange = useCallback(
      (data: { node: Node | null; editor: Editor; pos: number }) => {
         if (data.node) {
            setCurrentNode(data.node);
         }

         setCurrentNodePos(data.pos);
      },
      [setCurrentNodePos, setCurrentNode]
   );

   function duplicateNode() {
      editor.commands.setNodeSelection(currentNodePos);
      const { $anchor } = editor.state.selection;
      const selectedNode = $anchor.node(1) || (editor.state.selection as NodeSelection).node;
      editor
         .chain()
         .setMeta("hideDragHandle", true)
         .insertContentAt(currentNodePos + (currentNode?.nodeSize || 0), selectedNode.toJSON())
         .run();

      setMenuOpen(false);
      setContentMenuOpen(false);
      setAnyMenuOpen(false);
   }

   function deleteCurrentNode() {
      editor.chain().setMeta("hideDragHandle", true).setNodeSelection(currentNodePos).deleteSelection().run();

      setMenuOpen(false);
      setContentMenuOpen(false);
      setAnyMenuOpen(false);
   }

   // TODO: Re-add when dropdown menu is implemented
   // function handleAddNewNode() {
   //    if (currentNodePos !== -1) {
   //       const currentNodeSize = currentNode?.nodeSize || 0;
   //       const insertPos = currentNodePos + currentNodeSize;
   //       const currentNodeIsEmptyParagraph = currentNode?.type.name === "paragraph" && currentNode?.content?.size === 0;
   //       const focusPos = currentNodeIsEmptyParagraph ? currentNodePos + 2 : insertPos + 2;
   //       editor
   //          .chain()
   //          .command(({ dispatch, tr, state }: any) => {
   //             if (dispatch) {
   //                if (currentNodeIsEmptyParagraph) {
   //                   tr.insertText("/", currentNodePos, currentNodePos + 1);
   //                } else {
   //                   tr.insert(insertPos, state.schema.nodes.paragraph.create(null, [state.schema.text("/")]));
   //                }
   //
   //                return dispatch(tr);
   //             }
   //
   //             return true;
   //          })
   //          .focus(focusPos)
   //          .run();
   //    }
   // }

   useEffect(() => {
      if (menuOpen) {
         editor.commands.setMeta("lockDragHandle", true);
         setContentMenuOpen(true);
         setAnyMenuOpen(true);
      } else {
         editor.commands.setMeta("lockDragHandle", false);
         setContentMenuOpen(false);
         setAnyMenuOpen(false);
      }

      return () => {
         editor.commands.setMeta("lockDragHandle", false);
         setContentMenuOpen(false);
         setAnyMenuOpen(false);
      };
   }, [editor, menuOpen, setContentMenuOpen, setAnyMenuOpen]);

   return (
      <DragHandle
         pluginKey="ContentMenu"
         editor={editor}
         tippyOptions={{
            offset: [2, 0],
            zIndex: 99,
         }}
         onNodeChange={handleNodeChange}
         className={cn(editor.isEditable ? "visible" : "hidden", className)}
      >
         <div className="flex items-center pr-1.5">
            {/* TODO: Re-add when dropdown menu is implemented */}
            {/* <Tooltip>
                  <TooltipTrigger asChild>
                     <BaseButton
                        variant="ghost"
                        size="icon"
                        className="!size-5 cursor-grab text-muted-foreground hover:text-primary"
                        onClick={handleAddNewNode}
                        type="button"
                     >
                        <Plus className="size-3.5 shrink-0" />
                     </BaseButton>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8} className="text-xs">Insert block below</TooltipContent>
               </Tooltip> */}
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
               <div className="relative flex flex-col">
                  <Tooltip disableHoverableContent={true}>
                     <TooltipTrigger asChild>
                        <BaseButton
                           variant="ghost"
                           size="icon"
                           className="relative z-[1] !size-5 cursor-grab text-muted-foreground hover:text-primary"
                           onClick={(e) => {
                              e.preventDefault();
                              setMenuOpen(true);
                              editor.commands.setNodeSelection(currentNodePos);
                           }}
                           type="button"
                        >
                           <GripVertical className="size-3.5 shrink-0" />
                        </BaseButton>
                     </TooltipTrigger>
                     <TooltipContent side="bottom" sideOffset={8} className="text-[11px] px-2 py-1 bg-neutral-900 rounded shadow">
                        <div className="flex flex-col gap-0">
                           <span>
                              <span className="font-bold text-white">Drag</span>
                              <span className="text-neutral-400 font-normal"> to move</span>
                           </span>
                           <span>
                              <span className="font-bold text-white">Click</span>
                              <span className="text-neutral-400 font-normal"> to open menu</span>
                           </span>
                        </div>
                     </TooltipContent>
                  </Tooltip>
                  <PopoverTrigger className="absolute left-0 top-0 z-0 h-5 w-5" />
               </div>

               <PopoverContent align="start" side="bottom" sideOffset={8} className="w-max bg-background p-1">
                  <BaseButton
                     variant="ghost"
                     onClick={duplicateNode}
                     className="h-auto w-full justify-start gap-2 !rounded px-2 py-1 text-sm font-normal hover:bg-accent/50 hover:text-primary"
                  >
                     <Copy className="size-[15px] shrink-0" />
                     Duplicate
                  </BaseButton>
                  <Divider type="horizontal" />
                  <BaseButton
                     variant="ghost"
                     onClick={deleteCurrentNode}
                     className="h-auto w-full justify-start gap-2 !rounded px-2 py-1 text-sm font-normal hover:bg-red-50 hover:text-red-600"
                  >
                     <Trash2 className="size-[15px] shrink-0" />
                     Delete
                  </BaseButton>
               </PopoverContent>
            </Popover>
         </div>
      </DragHandle>
   );
}
