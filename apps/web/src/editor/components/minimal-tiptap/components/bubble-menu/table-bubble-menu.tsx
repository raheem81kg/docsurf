import * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { isActive } from "@tiptap/react";
import { Separator } from "@docsurf/ui/components/separator";
import ToolbarButton from "../toolbar-button";
import { HighlightPopoverButton } from "../section/three";
import { Merge, Split, Highlighter, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Trash2Icon, XIcon } from "lucide-react";
import { CellSelection } from "@tiptap/pm/tables";
import { BubbleMenu } from "@tiptap/react";

export interface TableBubbleMenuProps {
   editor: Editor;
   disabled?: boolean;
   actions?: Array<React.ComponentProps<typeof ToolbarButton>>;
}

export const TableBubbleMenu: React.FC<TableBubbleMenuProps> = ({ editor, disabled, actions }) => {
   const editorState = useEditorState({
      editor,
      selector: ({ editor }) => {
         const state = editor.state;
         const selection = state.selection;
         const isMultiCell =
            selection instanceof CellSelection &&
            selection.$anchorCell &&
            selection.$headCell &&
            selection.$anchorCell.pos !== selection.$headCell.pos;
         return {
            canAddColumnBefore: !!editor.can().addColumnBefore?.(),
            canAddColumnAfter: !!editor.can().addColumnAfter?.(),
            canDeleteColumn: !!editor.can().deleteColumn?.(),
            canAddRowBefore: !!editor.can().addRowBefore?.(),
            canAddRowAfter: !!editor.can().addRowAfter?.(),
            canDeleteRow: !!editor.can().deleteRow?.(),
            canMergeCells: !!editor.can().mergeCells?.(),
            canSplitCell: !!editor.can().splitCell?.(),
            canDeleteTable: !!editor.can().deleteTable?.(),
            isMultiCell,
         };
      },
   });

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

   // Actions for multi-cell selection
   const multiCellActions = [
      {
         onClick: onMergeCell,
         disabled: !editorState.canMergeCells,
         icon: <Merge className="size-4" />,
         tooltip: "Merge Cells",
      },
      {
         onClick: onSplitCell,
         disabled: !editorState.canSplitCell,
         icon: <Split className="size-4" />,
         tooltip: "Split Cells",
      },
   ];

   return (
      <BubbleMenu
         editor={editor}
         shouldShow={React.useCallback(({ editor }: { editor: Editor }) => isActive(editor.view.state, "table"), [])}
         tippyOptions={{
            placement: "bottom",
            onHidden: () => {},
            maxWidth: "auto",
            getReferenceClientRect: () => {
               const { state } = editor;
               const { selection } = state;
               let tableElement: HTMLElement | null = null;

               if (selection) {
                  const domAtPos = editor.view.domAtPos(selection.from);
                  let node: HTMLElement | null = domAtPos.node as HTMLElement;
                  while (node && node.nodeName.toLowerCase() !== "table") {
                     node = node.parentElement;
                  }
                  tableElement = node;
               }

               if (!tableElement) {
                  tableElement = editor.view.dom as HTMLElement;
               }

               return tableElement.getBoundingClientRect();
            },
         }}
      >
         {disabled ? null : (
            <div className="flex justify-center rounded border bg-background p-1 shadow-lg">
               <div className="inline-flex items-center gap-1">
                  {/* Always show delete table and highlight at the beginning */}
                  <ToolbarButton
                     tooltip="Delete Table"
                     onClick={onDeleteTable}
                     disabled={!editorState.canDeleteTable}
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
                  {editorState.isMultiCell ? (
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
                              disabled: !editorState.canAddColumnBefore,
                              icon: <ArrowLeft className="size-4" />,
                              tooltip: "Insert Column Before",
                           },
                           {
                              onClick: onAddColumnAfter,
                              disabled: !editorState.canAddColumnAfter,
                              icon: <ArrowRight className="size-4" />,
                              tooltip: "Insert Column After",
                           },
                           {
                              onClick: onDeleteColumn,
                              disabled: !editorState.canDeleteColumn,
                              icon: <XIcon className="size-4" />,
                              tooltip: "Delete Column",
                           },
                           "sep",
                           {
                              onClick: onAddRowAbove,
                              disabled: !editorState.canAddRowBefore,
                              icon: <ArrowUp className="size-4" />,
                              tooltip: "Insert Row Above",
                           },
                           {
                              onClick: onAddRowBelow,
                              disabled: !editorState.canAddRowAfter,
                              icon: <ArrowDown className="size-4" />,
                              tooltip: "Insert Row Below",
                           },
                           {
                              onClick: onDeleteRow,
                              disabled: !editorState.canDeleteRow,
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
