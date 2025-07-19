import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@docsurf/ui/components/dropdown-menu";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import { cn } from "@docsurf/ui/lib/utils";
import { LetterCaseCapitalizeIcon, ListBulletIcon } from "@radix-ui/react-icons";
import type { Level } from "@tiptap/extension-heading";
import { type Editor, useEditorState } from "@tiptap/react";
import type { VariantProps } from "class-variance-authority";
import { ChevronsUpDownIcon } from "lucide-react";
import type * as React from "react";
import { ListTodoIcon } from "../../../../custom/icons/list-todo-icon";
import type { FormatAction } from "../../../types";
import { ShortcutKey } from "../../shortcut-key";
import ToolbarButton from "../../toolbar-button";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";

type ListItemAction = "orderedList" | "bulletList" | "taskList";

interface TextStyle extends Omit<FormatAction, "value" | "icon" | "action" | "isActive" | "canExecute"> {
   element: keyof React.JSX.IntrinsicElements;
   level?: Level;
   listType?: ListItemAction;
   className: string;
}

const formatActions: TextStyle[] = [
   {
      label: "Normal Text",
      element: "span",
      className: "grow",
      shortcuts: ["mod", "alt", "0"],
   },
   {
      label: "Heading 1",
      element: "h1",
      level: 1,
      className: "m-0 grow text-3xl font-extrabold",
      shortcuts: ["mod", "alt", "1"],
   },
   {
      label: "Heading 2",
      element: "h2",
      level: 2,
      className: "m-0 grow text-xl font-bold",
      shortcuts: ["mod", "alt", "2"],
   },
   {
      label: "Heading 3",
      element: "h3",
      level: 3,
      className: "m-0 grow text-lg font-semibold",
      shortcuts: ["mod", "alt", "3"],
   },
   {
      label: "Numbered list",
      element: "div",
      listType: "orderedList",
      className: "grow flex items-center gap-2",
      shortcuts: ["mod", "shift", "7"],
   },
   {
      label: "Bullet list",
      element: "div",
      listType: "bulletList",
      className: "grow flex items-center gap-2",
      shortcuts: ["mod", "shift", "8"],
   },
   {
      label: "Task list",
      element: "div",
      listType: "taskList",
      className: "grow flex items-center gap-2",
      shortcuts: ["mod", "shift", "9"],
   },
];

interface BlockDropdownProps extends VariantProps<typeof toggleVariants> {
   editor: Editor;
   activeLevels?: Level[];
   isDocLocked?: boolean;
}

export const BlockDropdown: React.FC<BlockDropdownProps> = function BlockDropdown({
   editor,
   activeLevels = [1, 2, 3],
   size,
   variant,
   isDocLocked,
}) {
   const editorState = useEditorState({
      editor,
      selector: ({ editor }: { editor: Editor }) => {
         const headingLevels: Record<number, boolean> = {};
         [1, 2, 3].forEach((level) => {
            headingLevels[level] = editor.isActive("heading", { level });
         });

         return {
            isHeading: editor.isActive("heading"),
            isParagraph: editor.isActive("paragraph"),
            isCodeBlock: editor.isActive("codeBlock"),
            isBulletList: editor.isActive("bulletList"),
            isOrderedList: editor.isActive("orderedList"),
            isTaskList: editor.isActive("taskList"),
            headingLevels,
         };
      },
   });

   const isMobile = useIsMobile();

   const filteredActions = formatActions.filter((action) => {
      if (action.level) {
         return activeLevels.includes(action.level);
      }
      return true;
   });

   function handleStyleChange(level?: Level, listType?: ListItemAction) {
      if (listType) {
         toggleList(listType);
      } else if (level) {
         editor.chain().focus().toggleHeading({ level }).run();
      } else {
         editor.chain().focus().setParagraph().run();
      }
   }

   function toggleList(type: ListItemAction) {
      if (!editor) return;

      // Only turn off the currently active list type
      if (type === "bulletList" && editorState.isBulletList) {
         editor.chain().focus().toggleBulletList().run();
         return;
      }
      if (type === "orderedList" && editorState.isOrderedList) {
         editor.chain().focus().toggleOrderedList().run();
         return;
      }
      if (type === "taskList" && editorState.isTaskList) {
         editor.chain().focus().toggleList("taskList", "taskItem").run();
         return;
      }

      // If not active, turn on the target list type
      switch (type) {
         case "bulletList":
            editor.chain().focus().toggleBulletList().run();
            break;
         case "orderedList":
            editor.chain().focus().toggleOrderedList().run();
            break;
         case "taskList":
            editor.chain().focus().toggleList("taskList", "taskItem").run();
            break;
      }
   }

   function getListIcon(listType: ListItemAction) {
      switch (listType) {
         case "orderedList":
            return (
               <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                  <path d="M144-144v-48h96v-24h-48v-48h48v-24h-96v-48h120q10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9 10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9H144Zm0-240v-96q0-10.2 6.9-17.1 6.9-6.9 17.1-6.9h72v-24h-96v-48h120q10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v72q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9h-72v24h96v48H144Zm48-240v-144h-48v-48h96v192h-48Zm168 384v-72h456v72H360Zm0-204v-72h456v72H360Zm0-204v-72h456v72H360Z" />
               </svg>
            );
         case "bulletList":
            return <ListBulletIcon className="size-4" />;
         case "taskList":
            return <ListTodoIcon className="size-4" />;
         default:
            return null;
      }
   }

   function isListActive(listType: ListItemAction): boolean {
      switch (listType) {
         case "bulletList":
            return editorState.isBulletList;
         case "orderedList":
            return editorState.isOrderedList;
         case "taskList":
            return editorState.isTaskList;
         default:
            return false;
      }
   }

   function isListDisabled(listType: ListItemAction): boolean {
      // Only disable lists when document is locked or in code block
      // Lists should always be available for toggling
      return isDocLocked || editorState.isCodeBlock;
   }

   function getCurrentSelectionDisplay() {
      // Check for active list types first
      if (editorState.isBulletList) {
         return (
            <div className="flex items-center gap-1">
               <ListBulletIcon className="size-4" />
               <span className="text-xs">Bullet List</span>
            </div>
         );
      }
      if (editorState.isOrderedList) {
         return (
            <div className="flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                  <path d="M144-144v-48h96v-24h-48v-48h48v-24h-96v-48h120q10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9 10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9H144Zm0-240v-96q0-10.2 6.9-17.1 6.9-6.9 17.1-6.9h72v-24h-96v-48h120q10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v72q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9h-72v24h96v48H144Zm48-240v-144h-48v-48h96v192h-48Zm168 384v-72h456v72H360Zm0-204v-72h456v72H360Zm0-204v-72h456v72H360Z" />
               </svg>
               <span className="text-xs">Numbered List</span>
            </div>
         );
      }
      if (editorState.isTaskList) {
         return (
            <div className="flex items-center gap-1">
               <ListTodoIcon className="size-4" />
               <span className="text-xs">Task List</span>
            </div>
         );
      }

      // Check for active heading levels
      for (let level = 1; level <= 3; level++) {
         if (editorState.headingLevels[level]) {
            return (
               <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">H{level}</span>
                  <span className="text-xs">Heading {level}</span>
               </div>
            );
         }
      }

      // Default to normal text
      return (
         <div className="flex items-center gap-1">
            <span className="text-xs">Normal Text</span>
         </div>
      );
   }

   function renderMenuItem({ label, element: Element, level, listType, className, shortcuts }: TextStyle) {
      const isActive = listType ? isListActive(listType) : level ? editorState.headingLevels[level] : editorState.isParagraph;
      const isDisabled = listType ? isListDisabled(listType) : false;

      return (
         <DropdownMenuItem
            key={label}
            onClick={() => handleStyleChange(level, listType)}
            className={cn("flex flex-row items-center justify-between gap-4", {
               "bg-accent": isActive,
               "cursor-not-allowed opacity-50": isDocLocked || isDisabled,
            })}
            aria-label={label}
            disabled={isDocLocked || isDisabled}
         >
            <Element className={className}>
               {listType && getListIcon(listType)}
               {label}
            </Element>
            <ShortcutKey keys={shortcuts} />
         </DropdownMenuItem>
      );
   }

   // const handleApplyAll = React.useCallback(() => {
   //    if (!editor || blockEdits.length === 0) return;
   //    const blocks = getBlockBasedState(editor);
   //    blockEdits.forEach((edit) => {
   //       if (edit.editType === ("insert" as EditType)) {
   //          // Handle insert
   //          const pos = edit.placement === ("after_block" as Placement) ? edit.range.to : edit.range.from;
   //          editor
   //             .chain()
   //             .focus()
   //             .insertContentAt(pos, {
   //                type: "confirmBlockChange",
   //                attrs: {
   //                   changeType: edit.editType,
   //                   originalContent: "",
   //                   newContent: edit.content,
   //                   blockId: edit.id,
   //                },
   //             })
   //             .run();
   //       } else if (edit.editType === ("remove" as EditType)) {
   //          // Handle remove
   //          editor.chain().focus().deleteRange(edit.range).run();
   //       } else {
   //          // Handle replace
   //          editor
   //             .chain()
   //             .focus()
   //             .deleteRange(edit.range)
   //             .insertContentAt(edit.range.from, {
   //                type: "confirmBlockChange",
   //                attrs: {
   //                   changeType: edit.editType,
   //                   originalContent: "",
   //                   newContent: edit.content,
   //                   blockId: edit.id,
   //                },
   //             })
   //             .run();
   //       }
   //    });
   // }, [editor, blockEdits]);

   return (
      <div className="flex items-center gap-2">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <ToolbarButton
                  isActive={editorState.isHeading || editorState.isBulletList || editorState.isOrderedList || editorState.isTaskList}
                  tooltip="Text styles"
                  aria-label="Text styles"
                  pressed={editorState.isHeading || editorState.isBulletList || editorState.isOrderedList || editorState.isTaskList}
                  className="md:min-w-[120px] md:justify-between w-12 md:w-auto md:gap-2 gap-1"
                  disabled={editorState.isCodeBlock || isDocLocked}
                  size={size}
                  variant={variant}
                  disableHoverableContent
               >
                  {!isMobile ? getCurrentSelectionDisplay() : <LetterCaseCapitalizeIcon className="size-5" />}
                  <ChevronsUpDownIcon className="size-4" />
               </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full">
               {filteredActions.map(renderMenuItem)}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
};

BlockDropdown.displayName = "BlockDropdown";

export default BlockDropdown;
