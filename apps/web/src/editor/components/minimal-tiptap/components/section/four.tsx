import * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { FormatAction } from "../../types";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import type { VariantProps } from "class-variance-authority";
import { CaretDownIcon, ListBulletIcon } from "@radix-ui/react-icons";
import { ToolbarSection } from "../toolbar-section";
import { ListTodoIcon } from "../../../custom/icons/list-todo-icon";

type ListItemAction = "orderedList" | "bulletList" | "taskList";
interface ListItem extends FormatAction {
   value: ListItemAction;
}

function toggleList(editor: Editor, type: ListItemAction) {
   if (!editor) return;

   // First, turn off any active list
   if (editor.isActive("bulletList")) {
      editor.chain().focus().toggleBulletList().run();
   }
   if (editor.isActive("orderedList")) {
      editor.chain().focus().toggleOrderedList().run();
   }
   if (editor.isActive("taskList")) {
      editor.chain().focus().toggleList("taskList", "taskItem").run();
   }

   // Then, if we're not already in the target list type, turn it on
   if (!editor.isActive(type)) {
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
}

function canToggleList(editor: Editor, type: ListItemAction): boolean {
   if (!editor) return false;

   // If we're already in a list, we should be able to toggle to any other list type
   if (editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList")) {
      return true;
   }

   // Otherwise check if we can toggle the specific list type
   switch (type) {
      case "bulletList":
         return editor.can().chain().focus().toggleBulletList().run();
      case "orderedList":
         return editor.can().chain().focus().toggleOrderedList().run();
      case "taskList":
         return editor.can().chain().focus().toggleList("taskList", "taskItem").run();
      default:
         return false;
   }
}

interface SectionFourProps extends VariantProps<typeof toggleVariants> {
   editor: Editor;
   activeActions?: ListItemAction[];
   mainActionCount?: number;
   isDocLocked?: boolean;
}

export const SectionFour: React.FC<SectionFourProps> = ({
   editor,
   activeActions = ["orderedList", "bulletList", "taskList"],
   mainActionCount = 0,
   size,
   variant,
   isDocLocked,
}) => {
   const editorState = useEditorState({
      editor,
      selector: (context) => {
         function canToggleList(type: ListItemAction) {
            switch (type) {
               case "bulletList":
                  return context.editor.can().toggleBulletList();
               case "orderedList":
                  return context.editor.can().toggleOrderedList();
               case "taskList":
                  return context.editor.can().toggleList("taskList", "taskItem");
               default:
                  return false;
            }
         }
         return {
            isCodeBlock: context.editor.isActive("codeBlock"),
            isBulletList: context.editor.isActive("bulletList"),
            isOrderedList: context.editor.isActive("orderedList"),
            isTaskList: context.editor.isActive("taskList"),
            canBulletList: canToggleList("bulletList"),
            canOrderedList: canToggleList("orderedList"),
            canTaskList: canToggleList("taskList"),
         };
      },
   });

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

   function canToggleList(type: ListItemAction): boolean {
      if (!editor) return false;
      if (editorState.isBulletList || editorState.isOrderedList || editorState.isTaskList) {
         return true;
      }
      switch (type) {
         case "bulletList":
            return editor.can().chain().focus().toggleBulletList().run();
         case "orderedList":
            return editor.can().chain().focus().toggleOrderedList().run();
         case "taskList":
            return editor.can().chain().focus().toggleList("taskList", "taskItem").run();
         default:
            return false;
      }
   }

   const formatActionsWithActive: ListItem[] = [
      {
         value: "orderedList",
         label: "Numbered list",
         icon: (
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
               <path d="M144-144v-48h96v-24h-48v-48h48v-24h-96v-48h120q10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9 10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9H144Zm0-240v-96q0-10.2 6.9-17.1 6.9-6.9 17.1-6.9h72v-24h-96v-48h120q10.2 0 17.1 6.9 6.9 6.9 6.9 17.1v72q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9h-72v24h96v48H144Zm48-240v-144h-48v-48h96v192h-48Zm168 384v-72h456v72H360Zm0-204v-72h456v72H360Zm0-204v-72h456v72H360Z" />
            </svg>
         ),
         isActive: () => editorState.isOrderedList,
         action: () => toggleList("orderedList"),
         canExecute: () => true, // always allow click, handle disabled below
         shortcuts: ["mod", "shift", "7"],
      },
      {
         value: "bulletList",
         label: "Bullet list",
         icon: <ListBulletIcon className="size-4.5" />,
         isActive: () => editorState.isBulletList,
         action: () => toggleList("bulletList"),
         canExecute: () => true,
         shortcuts: ["mod", "shift", "8"],
      },
      {
         value: "taskList",
         label: "Task list",
         icon: <ListTodoIcon className="size-4.5" />,
         isActive: () => editorState.isTaskList,
         action: () => toggleList("taskList"),
         canExecute: () => true,
         shortcuts: ["mod", "shift", "9"],
      },
   ];

   // Compute disabled state for each list type
   const disabledMap = {
      orderedList: !editorState.isOrderedList && !editorState.canOrderedList,
      bulletList: !editorState.isBulletList && !editorState.canBulletList,
      taskList: !editorState.isTaskList && !editorState.canTaskList,
   };

   return (
      <ToolbarSection
         editor={editor}
         actions={formatActionsWithActive.map((action) => ({
            ...action,
            disabled: disabledMap[action.value],
         }))}
         aria-label={`${
            editorState.isOrderedList ? "Ordered" : editorState.isBulletList ? "Bullet" : editorState.isTaskList ? "Task" : "List"
         } list`}
         activeActions={activeActions}
         mainActionCount={mainActionCount}
         dropdownIcon={
            <>
               <ListBulletIcon className="size-4.5" />
               <CaretDownIcon className="size-4.5" />
            </>
         }
         dropdownTooltip="Lists"
         size={size}
         variant={variant}
         disableHoverableContent
         disabled={isDocLocked}
      />
   );
};

SectionFour.displayName = "SectionFour";

export default SectionFour;
