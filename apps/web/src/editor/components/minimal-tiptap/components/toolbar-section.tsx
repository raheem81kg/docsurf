import * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { FormatAction } from "../types";
import type { VariantProps } from "class-variance-authority";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import { cn } from "@docsurf/ui/lib/utils";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@docsurf/ui/components/dropdown-menu";
import { ToolbarButton } from "./toolbar-button";
import { ShortcutKey } from "./shortcut-key";
import { getShortcutKey } from "../utils";

interface ToolbarSectionProps extends VariantProps<typeof toggleVariants> {
   editor: Editor;
   actions: FormatAction[];
   activeActions?: string[];
   mainActionCount?: number;
   dropdownIcon?: React.ReactNode;
   dropdownTooltip?: string;
   dropdownClassName?: string;
   disableHoverableContent?: boolean;
   disabled?: boolean;
}

export const ToolbarSection: React.FC<ToolbarSectionProps> = ({
   editor,
   actions,
   activeActions = actions.map((action) => action.value),
   mainActionCount = 0,
   dropdownIcon,
   dropdownTooltip = "More options",
   dropdownClassName = "w-12",
   size,
   variant,
   disableHoverableContent,
   disabled,
}) => {
   const { mainActions, dropdownActions } = React.useMemo(() => {
      const sortedActions = actions
         .filter((action) => activeActions.includes(action.value))
         .sort((a, b) => activeActions.indexOf(a.value) - activeActions.indexOf(b.value));

      return {
         mainActions: sortedActions.slice(0, mainActionCount),
         dropdownActions: sortedActions.slice(mainActionCount),
      };
   }, [actions, activeActions, mainActionCount]);

   const editorState = useEditorState({
      editor,
      selector: ({ editor }) => ({
         canExecute: Object.fromEntries(actions.map((a) => [a.value, a.canExecute(editor)])),
         isActive: Object.fromEntries(actions.map((a) => [a.value, a.isActive(editor)])),
         editor,
      }),
   });

   const renderToolbarButton = React.useCallback(
      (action: FormatAction) => (
         <ToolbarButton
            key={action.label}
            onClick={() => action.action(editorState.editor)}
            disabled={!editorState.canExecute[action.value] || disabled}
            isActive={editorState.isActive[action.value]}
            tooltip={`${action.label} ${action.shortcuts.map((s) => getShortcutKey(s).symbol).join(" ")}`}
            aria-label={action.label}
            size={size}
            variant={variant}
            disableHoverableContent={disableHoverableContent}
         >
            {action.icon}
         </ToolbarButton>
      ),
      [editorState, size, variant, disabled, disableHoverableContent]
   );

   const renderDropdownMenuItem = React.useCallback(
      (action: FormatAction) => (
         <DropdownMenuItem
            key={action.label}
            onClick={() => action.action(editorState.editor)}
            disabled={!editorState.canExecute[action.value] || disabled}
            className={cn("flex flex-row items-center justify-between gap-4", {
               "bg-accent": editorState.isActive[action.value],
            })}
            aria-label={action.label}
         >
            <span className="grow">{action.label}</span>
            <ShortcutKey keys={action.shortcuts} />
         </DropdownMenuItem>
      ),
      [editorState, disabled]
   );

   const isDropdownActive = React.useMemo(
      () => dropdownActions.some((action) => editorState.isActive[action.value]),
      [dropdownActions, editorState]
   );

   return (
      <>
         {mainActions.map(renderToolbarButton)}
         {dropdownActions.length > 0 && (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <ToolbarButton
                     isActive={isDropdownActive}
                     tooltip={dropdownTooltip}
                     aria-label={dropdownTooltip}
                     className={cn(dropdownClassName)}
                     size={size}
                     variant={variant}
                     disableHoverableContent={disableHoverableContent}
                     disabled={disabled}
                  >
                     {dropdownIcon || <CaretDownIcon className="size-5" />}
                  </ToolbarButton>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-full">
                  {dropdownActions.map(renderDropdownMenuItem)}
               </DropdownMenuContent>
            </DropdownMenu>
         )}
      </>
   );
};

export default ToolbarSection;
