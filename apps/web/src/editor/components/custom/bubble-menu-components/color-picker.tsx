/**
 * Color picker component for bubble menu text and background color selection.
 * Provides a unified interface for changing text colors and highlight colors
 * with proper TypeScript types and accessibility features.
 */

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { ToolbarButton } from "../../minimal-tiptap/components/toolbar-button";
import { Popover, PopoverTrigger, PopoverContent } from "@docsurf/ui/components/popover";
import { cn } from "@docsurf/ui/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@docsurf/ui/components/tooltip";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ColorOption {
   value: string;
   label: string;
   bgColor: string;
   darkLabel?: string;
}

interface ColorSection {
   title: string;
   colors: ColorOption[];
   type: "text" | "background";
}

interface ColorButtonProps {
   color: ColorOption;
   isSelected: boolean;
   onClick: () => void;
   isTextColor: boolean;
   disabled?: boolean;
}

interface ColorPickerProps {
   editor: Editor;
   containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface EditorState {
   textColor: string;
   highlightColor: string;
   isDisabled: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TEXT_COLORS: ColorOption[] = [
   { value: "hsl(var(--foreground))", label: "Default", bgColor: "#374151" },
   { value: "#6b7280", label: "Gray", bgColor: "#1f2937" },
   { value: "#d97706", label: "Brown", bgColor: "#451a03" },
   { value: "#ea580c", label: "Orange", bgColor: "#7c2d12" },
   { value: "#eab308", label: "Gold", bgColor: "#713f12" },
   { value: "#16a34a", label: "Green", bgColor: "#14532d" },
   { value: "#2563eb", label: "Blue", bgColor: "#1e3a8a" },
   { value: "#7c3aed", label: "Purple", bgColor: "#581c87" },
   { value: "#ec4899", label: "Pink", bgColor: "#831843" },
   { value: "#dc2626", label: "Red", bgColor: "#7f1d1d" },
];

const BACKGROUND_COLORS: ColorOption[] = [
   { value: "", label: "Default background", bgColor: "transparent" },
   { value: "#374151", label: "Gray", bgColor: "#374151" },
   { value: "#451a03", label: "Brown", bgColor: "#451a03" },
   { value: "#7c2d12", label: "Orange", bgColor: "#7c2d12" },
   { value: "#713f12", label: "Gold", bgColor: "#713f12" },
   { value: "#14532d", label: "Green", bgColor: "#14532d" },
   { value: "#1e3a8a", label: "Blue", bgColor: "#1e3a8a" },
   { value: "#581c87", label: "Purple", bgColor: "#581c87" },
   { value: "#831843", label: "Pink", bgColor: "#831843" },
   { value: "#7f1d1d", label: "Red", bgColor: "#7f1d1d" },
];

const COLOR_SECTIONS: ColorSection[] = [
   {
      title: "Text color",
      colors: TEXT_COLORS,
      type: "text",
   },
   {
      title: "Background color",
      colors: BACKGROUND_COLORS,
      type: "background",
   },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines if the editor is in a state where color changes are disabled
 */
const isEditorDisabled = (editor: Editor | null): boolean => {
   if (!editor) return true;

   return editor.isActive("code") || editor.isActive("codeBlock") || editor.isActive("imageUpload");
};

/**
 * Gets the current text color from editor attributes
 */
const getCurrentTextColor = (editor: Editor): string => {
   return editor.getAttributes("textStyle")?.color || "hsl(var(--foreground))";
};

/**
 * Gets the current highlight color from editor attributes
 */
const getCurrentHighlightColor = (editor: Editor): string => {
   return editor.getAttributes("highlight")?.color || "";
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Custom tooltip component that renders outside container context
 * to avoid z-index stacking issues with popovers
 */
function CustomTooltip({
   children,
   content,
   side = "top",
}: {
   children: React.ReactNode;
   content: string;
   side?: "top" | "bottom" | "left" | "right";
}) {
   return (
      <Tooltip disableHoverableContent={true}>
         <TooltipTrigger asChild>{children}</TooltipTrigger>
         <TooltipContent
            side={side}
            className="z-[9999]"
            sideOffset={8}
            showArrow={false}
            // Force rendering outside any container context
            container={typeof document !== "undefined" ? document.body : undefined}
         >
            <p>{content}</p>
         </TooltipContent>
      </Tooltip>
   );
}

/**
 * Individual color button component with proper accessibility and visual feedback
 */
function ColorButton({ color, isSelected, onClick, isTextColor, disabled = false }: ColorButtonProps) {
   const handleClick = React.useCallback(() => {
      if (!disabled) {
         onClick();
      }
   }, [onClick, disabled]);

   const getTextColor = React.useCallback(() => {
      if (color.value === "hsl(var(--foreground))") {
         return "#ffffff";
      }
      return color.value;
   }, [color.value]);

   const button = (
      <button
         type="button"
         className={cn(
            "relative size-6.5 rounded border transition-all hover:scale-105",
            isSelected ? "border-gray-400 ring-2 ring-gray-400/20" : "border-gray-600 hover:border-gray-500",
            disabled && "cursor-not-allowed opacity-50"
         )}
         style={{ backgroundColor: color.bgColor }}
         onClick={handleClick}
         disabled={disabled}
         aria-label={`Select ${color.label} ${isTextColor ? "text" : "background"} color`}
      >
         {isTextColor && (
            <span className="absolute inset-0 flex items-center justify-center font-bold text-sm" style={{ color: getTextColor() }}>
               A
            </span>
         )}
      </button>
   );

   return <CustomTooltip content={color.label}>{button}</CustomTooltip>;
}

/**
 * Color section component that renders a group of color buttons
 */
interface ColorSectionProps {
   section: ColorSection;
   selectedColor: string;
   onColorChange: (color: string) => void;
   disabled?: boolean;
}

function ColorSection({ section, selectedColor, onColorChange, disabled }: ColorSectionProps) {
   const handleColorChange = React.useCallback(
      (color: ColorOption) => {
         onColorChange(color.value);
      },
      [onColorChange]
   );

   return (
      <div>
         <h3 className="text-sm font-medium text-foreground mb-3">{section.title}</h3>
         <div className="grid grid-cols-5 gap-2">
            {section.colors.map((color) => (
               <ColorButton
                  key={color.value}
                  color={color}
                  isSelected={selectedColor === color.value}
                  onClick={() => handleColorChange(color)}
                  isTextColor={section.type === "text"}
                  disabled={disabled}
               />
            ))}
         </div>
      </div>
   );
}

/**
 * Main color picker component for bubble menu
 * Provides text and background color selection with proper state management
 */
export function ColorPicker({ editor, containerRef }: ColorPickerProps) {
   // Editor state management
   const editorState = useEditorState({
      editor,
      selector: (context): EditorState => ({
         textColor: getCurrentTextColor(context.editor),
         highlightColor: getCurrentHighlightColor(context.editor),
         isDisabled: isEditorDisabled(context.editor),
      }),
   });

   // Local state for immediate UI feedback
   const [selectedTextColor, setSelectedTextColor] = React.useState(editorState.textColor);
   const [selectedHighlightColor, setSelectedHighlightColor] = React.useState(editorState.highlightColor);

   // Update local state when editor state changes
   React.useEffect(() => {
      setSelectedTextColor(editorState.textColor);
   }, [editorState.textColor]);

   React.useEffect(() => {
      setSelectedHighlightColor(editorState.highlightColor);
   }, [editorState.highlightColor]);

   // Color change handlers
   const handleTextColorChange = React.useCallback(
      (color: string) => {
         if (editorState.isDisabled) return;

         setSelectedTextColor(color);
         editor.chain().setColor(color).run();
      },
      [editor, editorState.isDisabled]
   );

   const handleHighlightColorChange = React.useCallback(
      (color: string) => {
         if (editorState.isDisabled) return;

         setSelectedHighlightColor(color);
         if (color === "") {
            editor.chain().focus().unsetMark("highlight").run();
         } else {
            editor.chain().focus().setHighlight({ color }).run();
         }
      },
      [editor, editorState.isDisabled]
   );

   return (
      <Popover modal={true}>
         <PopoverTrigger asChild>
            <ToolbarButton
               tooltip="Text & background color"
               aria-label="Text & background color"
               className="h-8 px-6 gap-1 rounded-l-none !border-l !border-border/50 !border-solid"
               disabled={editorState.isDisabled}
            >
               <div className="size-4.5 rounded border border-gray-600 bg-gray-700 flex items-center justify-center">
                  <span className="text-xs p-1 font-bold text-white">A</span>
               </div>
               <CaretDownIcon className="size-3.5" />
            </ToolbarButton>
         </PopoverTrigger>
         <PopoverContent
            align="start"
            className="w-58 md:w-52 p-3 space-y-4 rounded-xl"
            container={containerRef?.current ?? undefined}
         >
            {COLOR_SECTIONS.map((section) => (
               <ColorSection
                  key={section.type}
                  section={section}
                  selectedColor={section.type === "text" ? selectedTextColor : selectedHighlightColor}
                  onColorChange={section.type === "text" ? handleTextColorChange : handleHighlightColorChange}
                  disabled={editorState.isDisabled}
               />
            ))}
         </PopoverContent>
      </Popover>
   );
}
