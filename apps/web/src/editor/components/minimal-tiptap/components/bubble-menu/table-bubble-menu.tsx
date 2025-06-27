import * as React from "react";
import type { Editor } from "@tiptap/core";
import { isActive } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react";
import { Separator } from "@docsurf/ui/components/separator";
import ToolbarButton from "../toolbar-button";
import { HighlightPopoverButton } from "../section/three";
import { Merge, Split, Highlighter, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Trash2Icon, XIcon } from "lucide-react";
import { CellSelection } from "@tiptap/pm/tables";

export interface TableBubbleMenuProps {
   editor: Editor;
   disabled?: boolean;
   actions?: Array<React.ComponentProps<typeof ToolbarButton>>;
}

export const TableBubbleMenu: React.FC<TableBubbleMenuProps> = ({ editor, disabled, actions }) => {
   const shouldShow = React.useCallback(({ editor }: { editor: Editor }) => isActive(editor.view.state, "table"), []);

   function onAddColumnBefore() {
      editor.chain().focus().addColumnBefore().run();
   }
   function onAddColumnAfter() {
      editor.chain().focus().addColumnAfter().run();
   }
   function onDeleteColumn() {
      editor.chain().focus().deleteColumn().run();
   }
   function onAddRowAbove() {
      editor.chain().focus().addRowBefore().run();
   }
   function onAddRowBelow() {
      editor.chain().focus().addRowAfter().run();
   }
   function onDeleteRow() {
      editor.chain().focus().deleteRow().run();
   }
   function onMergeCell() {
      editor.chain().focus().mergeCells().run();
   }
   function onSplitCell() {
      editor?.chain().focus().splitCell().run();
   }
   function onDeleteTable() {
      editor.chain().focus().deleteTable().run();
   }
   function onSetCellBackground(color: string) {
      if (typeof editor.commands.setCellAttribute === "function") {
         editor.chain().focus().setCellAttribute("backgroundColor", color).run();
      } else {
         editor.chain().focus().setTableCellBackground(color).run();
      }
   }

   // Detect if multiple cells are selected
   const { state } = editor;
   const isMultiCell =
      state.selection instanceof CellSelection &&
      state.selection.$anchorCell &&
      state.selection.$headCell &&
      state.selection.$anchorCell.pos !== state.selection.$headCell.pos;

   // Actions for multi-cell selection
   const multiCellActions = [
      {
         onClick: onMergeCell,
         disabled: !editor?.can()?.mergeCells?.(),
         icon: <Merge className="size-4" />,
         tooltip: "Merge Cells",
      },
      {
         onClick: onSplitCell,
         disabled: !editor?.can()?.splitCell?.(),
         icon: <Split className="size-4" />,
         tooltip: "Split Cells",
      },
   ];

   return (
      <BubbleMenu
         editor={editor}
         shouldShow={shouldShow}
         tippyOptions={{
            placement: "bottom",
            onHidden: () => {},
            maxWidth: "auto",
            getReferenceClientRect: () => {
               // Find the table node in the DOM from the selection
               const { state } = editor;
               const { selection } = state;
               let tableElement: HTMLElement | null = null;

               if (selection) {
                  // Find the parent table node from the anchor
                  const domAtPos = editor.view.domAtPos(selection.from);
                  let node: HTMLElement | null = domAtPos.node as HTMLElement;
                  while (node && node.nodeName.toLowerCase() !== "table") {
                     node = node.parentElement;
                  }
                  tableElement = node;
               }

               // Fallback: just use the editor root
               if (!tableElement) {
                  tableElement = editor.view.dom as HTMLElement;
               }

               return tableElement.getBoundingClientRect();
            },
         }}
      >
         {disabled ? null : (
            <div className="flex justify-center rounded border bg-default p-1 shadow-lg">
               <div className="inline-flex items-center gap-1">
                  {/* Always show delete table and highlight at the beginning */}
                  <ToolbarButton
                     tooltip="Delete Table"
                     onClick={onDeleteTable}
                     disabled={!editor?.can()?.deleteTable?.()}
                     className="w-auto px-2"
                  >
                     <Trash2Icon className="size-4" />
                  </ToolbarButton>
                  <HighlightPopoverButton
                     tooltip="Cell highlight"
                     icon={<Highlighter className="size-4" />}
                     onColorChange={onSetCellBackground}
                     onRemove={() => onSetCellBackground("")}
                     colors={[
                        { value: "#fff475", label: "Yellow" },
                        { value: "#fbbc04", label: "Orange" },
                        { value: "#a7ffeb", label: "Teal" },
                        { value: "#cbf0f8", label: "Blue" },
                        { value: "#ccff90", label: "Green" },
                        { value: "#fdcfe8", label: "Pink" },
                        { value: "#d7aefb", label: "Purple" },
                        { value: "#e6c9a8", label: "Brown" },
                     ]}
                  />
                  {/* No separator between delete and highlight */}
                  {isMultiCell ? (
                     <>
                        <Separator orientation="vertical" />
                        {multiCellActions.map((action, i) => (
                           <ToolbarButton
                              key={i}
                              tooltip={action.tooltip}
                              onClick={action.onClick}
                              disabled={action.disabled}
                              className="w-auto px-2"
                           >
                              {action.icon}
                           </ToolbarButton>
                        ))}
                     </>
                  ) : (
                     <>
                        <Separator orientation="vertical" />
                        {/* Rest of the table actions except delete/merge/split/highlight */}
                        {[
                           {
                              onClick: onAddColumnBefore,
                              disabled: !editor?.can()?.addColumnBefore?.(),
                              icon: <ArrowLeft className="size-4" />,
                              tooltip: "Insert Column Before",
                           },
                           {
                              onClick: onAddColumnAfter,
                              disabled: !editor?.can()?.addColumnAfter?.(),
                              icon: <ArrowRight className="size-4" />,
                              tooltip: "Insert Column After",
                           },
                           {
                              onClick: onDeleteColumn,
                              disabled: !editor?.can().deleteColumn?.(),
                              icon: <XIcon className="size-4" />,
                              tooltip: "Delete Column",
                           },
                           "sep",
                           {
                              onClick: onAddRowAbove,
                              disabled: !editor?.can().addRowBefore?.(),
                              icon: <ArrowUp className="size-4" />,
                              tooltip: "Insert Row Above",
                           },
                           {
                              onClick: onAddRowBelow,
                              disabled: !editor?.can()?.addRowAfter?.(),
                              icon: <ArrowDown className="size-4" />,
                              tooltip: "Insert Row Below",
                           },
                           {
                              onClick: onDeleteRow,
                              disabled: !editor?.can()?.deleteRow?.(),
                              icon: <XIcon className="size-4" />,
                              tooltip: "Delete Row",
                           },
                        ].map((action, i) => {
                           if (action === "sep") {
                              return <Separator key={i} orientation="vertical" />;
                           }
                           if (typeof action === "object" && action !== null) {
                              return (
                                 <ToolbarButton
                                    key={i}
                                    tooltip={action.tooltip}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    className="w-auto px-2"
                                 >
                                    {action.icon}
                                 </ToolbarButton>
                              );
                           }
                           return null;
                        })}
                     </>
                  )}
                  {actions?.map((item, i) => (
                     <React.Fragment key={`custom-${i}`}>
                        <Separator orientation="vertical" />
                        <ToolbarButton {...item} />
                     </React.Fragment>
                  ))}
               </div>
            </div>
         )}
      </BubbleMenu>
   );
};
