import * as React from "react";
import type { Editor } from "@tiptap/react";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import type { VariantProps } from "class-variance-authority";
import { CaretDownIcon, CheckIcon } from "@radix-ui/react-icons";
import { ToolbarButton } from "../toolbar-button";
import { Popover, PopoverTrigger, PopoverContent } from "@docsurf/ui/components/popover";
import { ToggleGroup, ToggleGroupItem } from "@docsurf/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { useTheme } from "../../hooks/use-theme";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Check } from "lucide-react";

import { Ban as BanIcon } from "lucide-react";
import { Separator } from "@docsurf/ui/components/separator";
import { Button } from "@docsurf/ui/components/button";
import { HighlighterIcon } from "../../../custom/icons/highlighter-icon";
import { useEditorState } from "@tiptap/react";

interface ColorItem {
   cssVar: string;
   label: string;
   darkLabel?: string;
}

interface ColorPalette {
   label: string;
   colors: ColorItem[];
   inverse: string;
}

const COLORS: ColorPalette[] = [
   {
      label: "Palette 1",
      inverse: "hsl(var(--background))",
      colors: [
         { cssVar: "hsl(var(--foreground))", label: "Default" },
         { cssVar: "var(--mt-accent-bold-blue)", label: "Bold blue" },
         { cssVar: "var(--mt-accent-bold-teal)", label: "Bold teal" },
         { cssVar: "var(--mt-accent-bold-green)", label: "Bold green" },
         { cssVar: "var(--mt-accent-bold-orange)", label: "Bold orange" },
         { cssVar: "var(--mt-accent-bold-red)", label: "Bold red" },
         { cssVar: "var(--mt-accent-bold-purple)", label: "Bold purple" },
      ],
   },
   {
      label: "Palette 2",
      inverse: "hsl(var(--background))",
      colors: [
         { cssVar: "var(--mt-accent-gray)", label: "Gray" },
         { cssVar: "var(--mt-accent-blue)", label: "Blue" },
         { cssVar: "var(--mt-accent-teal)", label: "Teal" },
         { cssVar: "var(--mt-accent-green)", label: "Green" },
         { cssVar: "var(--mt-accent-orange)", label: "Orange" },
         { cssVar: "var(--mt-accent-red)", label: "Red" },
         { cssVar: "var(--mt-accent-purple)", label: "Purple" },
      ],
   },
   {
      label: "Palette 3",
      inverse: "hsl(var(--foreground))",
      colors: [
         { cssVar: "hsl(var(--background))", label: "White", darkLabel: "Black" },
         { cssVar: "var(--mt-accent-blue-subtler)", label: "Blue subtle" },
         { cssVar: "var(--mt-accent-teal-subtler)", label: "Teal subtle" },
         { cssVar: "var(--mt-accent-green-subtler)", label: "Green subtle" },
         { cssVar: "var(--mt-accent-yellow-subtler)", label: "Yellow subtle" },
         { cssVar: "var(--mt-accent-red-subtler)", label: "Red subtle" },
         { cssVar: "var(--mt-accent-purple-subtler)", label: "Purple subtle" },
      ],
   },
];

interface ColorButtonProps {
   color: ColorItem;
   isSelected: boolean;
   inverse: string;
   onClick: (value: string) => void;
}
function ColorButton({ color, isSelected, inverse, onClick }: ColorButtonProps) {
   const isDarkMode = useTheme();
   const label = isDarkMode && color.darkLabel ? color.darkLabel : color.label;
   return (
      <Tooltip disableHoverableContent={true}>
         <TooltipTrigger asChild>
            <ToggleGroupItem
               tabIndex={0}
               className="relative size-7 rounded-sm p-0"
               value={color.cssVar}
               aria-label={label}
               style={{ backgroundColor: color.cssVar }}
               onClick={(e) => {
                  e.preventDefault();
                  onClick(color.cssVar);
               }}
            >
               {isSelected && <CheckIcon className="absolute inset-0 m-auto size-6" style={{ color: inverse }} />}
            </ToggleGroupItem>
         </TooltipTrigger>
         <TooltipContent side="bottom">
            <p>{label}</p>
         </TooltipContent>
      </Tooltip>
   );
}

interface ColorPickerProps {
   palette: ColorPalette;
   selectedColor: string;
   inverse: string;
   onColorChange: (value: string) => void;
}
function ColorPicker({ palette, selectedColor, inverse, onColorChange }: ColorPickerProps) {
   return (
      <ToggleGroup
         type="single"
         value={selectedColor}
         onValueChange={(value: string) => {
            if (value) onColorChange(value);
         }}
         className="gap-1.5"
      >
         {palette.colors.map((color, index) => (
            <ColorButton
               key={index}
               inverse={inverse}
               color={color}
               isSelected={selectedColor === color.cssVar}
               onClick={onColorChange}
            />
         ))}
      </ToggleGroup>
   );
}

interface SectionThreeProps extends VariantProps<typeof toggleVariants> {
   editor: Editor;
   isDocLocked?: boolean;
}

const alignmentOptions = [
   {
      name: "Left Align",
      value: "left",
      icon: <AlignLeft className="h-4 w-4" />,
   },
   {
      name: "Center Align",
      value: "center",
      icon: <AlignCenter className="h-4 w-4" />,
   },
   {
      name: "Right Align",
      value: "right",
      icon: <AlignRight className="h-4 w-4" />,
   },
   {
      name: "Justify Align",
      value: "justify",
      icon: <AlignJustify className="h-4 w-4" />,
   },
];

const handleAlign = (editor: Editor | null, value: string) => {
   editor?.chain().focus().setTextAlign(value).run();
};

const currentTextAlign = (editor: Editor | null) => {
   if (editor?.isActive({ textAlign: "left" })) {
      return "left";
   }
   if (editor?.isActive({ textAlign: "center" })) {
      return "center";
   }
   if (editor?.isActive({ textAlign: "right" })) {
      return "right";
   }
   if (editor?.isActive({ textAlign: "justify" })) {
      return "justify";
   }
   return "left";
};

const isAlignDisabled = (editor: Editor | null) => {
   return editor?.isActive("image") || editor?.isActive("video") || !editor;
};

// Highlight colors
const HIGHLIGHT_COLORS = [
   { value: "hsl(54 50% 25%)", label: "Yellow" },
   { value: "#f5a623", label: "Orange" },
   { value: "hsl(174 50% 25%)", label: "Teal" },
   { value: "hsl(214 50% 25%)", label: "Blue" },
   { value: "hsl(138 40% 25%)", label: "Green" },
   { value: "hsl(330 50% 35%)", label: "Pink" },
   { value: "hsl(270 50% 25%)", label: "Purple" },
   { value: "hsl(0 50% 25%)", label: "Red" },
];

type HighlightMenuItem = { value: string; label: string };

interface HighlightButtonProps {
   color: string;
   label: string;
   isSelected: boolean;
   onClick: (value: string) => void;
   tabIndex?: number;
   dataHighlighted?: boolean;
   disabled?: boolean;
}
function HighlightButton({ color, label, isSelected, onClick, tabIndex, dataHighlighted, disabled }: HighlightButtonProps) {
   return (
      <Tooltip disableHoverableContent={true}>
         <TooltipTrigger asChild>
            <ToggleGroupItem
               tabIndex={tabIndex}
               className="relative size-7 rounded-sm border border-border p-0"
               value={color}
               aria-label={label}
               style={{ backgroundColor: color }}
               onClick={(e) => {
                  e.preventDefault();
                  onClick(color);
               }}
               data-highlighted={dataHighlighted}
               disabled={disabled}
            >
               {isSelected && <CheckIcon className="absolute inset-0 m-auto size-6 text-primary" style={{ color: "#222" }} />}
            </ToggleGroupItem>
         </TooltipTrigger>
         <TooltipContent side="bottom">
            <p>{label}</p>
         </TooltipContent>
      </Tooltip>
   );
}

interface HighlightPickerProps {
   colors: { value: string; label: string }[];
   selectedColor: string;
   onColorChange: (value: string) => void;
   selectedIndex: number;
   disabled?: boolean;
}
function HighlightPicker({ colors, selectedColor, onColorChange, selectedIndex, disabled }: HighlightPickerProps) {
   return (
      <ToggleGroup
         type="single"
         value={selectedColor}
         onValueChange={(value: string) => {
            if (value) onColorChange(value);
         }}
         className="grid grid-cols-4 place-items-center gap-1"
      >
         {colors.map((color, index) => (
            <HighlightButton
               key={color.value}
               color={color.value}
               label={color.label + " highlight color"}
               isSelected={selectedColor === color.value}
               onClick={onColorChange}
               tabIndex={index === selectedIndex ? 0 : -1}
               dataHighlighted={selectedIndex === index}
               disabled={disabled}
            />
         ))}
      </ToggleGroup>
   );
}

/**
 * Reusable popover button for highlight color picking, as used in SectionThree.
 */
export const HighlightPopoverButton = ({
   tooltip = "Highlight",
   icon = <HighlighterIcon className="size-4.5" />,
   colors = HIGHLIGHT_COLORS,
   selectedColor = "",
   onColorChange,
   selectedIndex = 0,
   disabled = false,
   onRemove,
}: {
   tooltip?: string;
   icon?: React.ReactNode;
   colors?: { value: string; label: string }[];
   selectedColor?: string;
   onColorChange: (value: string) => void;
   selectedIndex?: number;
   disabled?: boolean;
   onRemove?: () => void;
}) => {
   const [open, setOpen] = React.useState(false);
   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <ToolbarButton tooltip={tooltip} aria-label={tooltip} className="w-9" isActive={!!selectedColor} disabled={disabled}>
               {icon}
            </ToolbarButton>
         </PopoverTrigger>
         <PopoverContent align="start" className="w-40 p-1.5">
            <div className="flex flex-col gap-1" role="menu">
               {onRemove && (
                  <Button
                     onClick={onRemove}
                     aria-label="Remove highlight"
                     type="button"
                     role="menuitem"
                     data-style="ghost"
                     disabled={disabled}
                     className="mb-1 flex w-full items-center gap-2 rounded bg-foreground px-2 py-1 text-xs"
                     style={{ minHeight: 28 }}
                  >
                     <BanIcon className="h-4 w-4" />
                     <span>Remove highlight</span>
                  </Button>
               )}
               {onRemove && <Separator className="my-1" />}
               <HighlightPicker
                  colors={colors}
                  selectedColor={selectedColor}
                  onColorChange={onColorChange}
                  selectedIndex={selectedIndex}
                  disabled={disabled}
               />
            </div>
         </PopoverContent>
      </Popover>
   );
};

export const SectionThree: React.FC<SectionThreeProps> = ({ editor, size, variant, isDocLocked }) => {
   const editorState = useEditorState({
      editor,
      selector: (context) => {
         // Determine current text alignment
         let textAlign = "left";
         if (context.editor.isActive({ textAlign: "center" })) textAlign = "center";
         else if (context.editor.isActive({ textAlign: "right" })) textAlign = "right";
         else if (context.editor.isActive({ textAlign: "justify" })) textAlign = "justify";
         // Determine if alignment controls should be disabled
         const isAlignDisabled = context.editor.isActive("image") || context.editor.isActive("video") || !context.editor;
         return {
            color: context.editor.getAttributes("textStyle")?.color || "hsl(var(--foreground))",
            highlightColor: context.editor.getAttributes("highlight")?.color || "",
            isDisabled:
               !context.editor ||
               context.editor.isActive("code") ||
               context.editor.isActive("codeBlock") ||
               context.editor.isActive("imageUpload"),
            textAlign,
            isAlignDisabled,
         };
      },
   });
   const [selectedColor, setSelectedColor] = React.useState(editorState.color);
   const [alignOpen, setAlignOpen] = React.useState(false);
   const alignValue = editorState.textAlign;
   const currentAlignOption = alignmentOptions.find((o) => o.value === alignValue);
   const [highlightOpen, setHighlightOpen] = React.useState(false);
   const highlightMenuRef = React.useRef(null);

   function onCloseHighlight() {
      setHighlightOpen(false);
   }
   function removeHighlight() {
      if (!editor) return;
      editor.chain().focus().unsetMark("highlight").run();
      setHighlightOpen(false);
   }
   function handleColorChange(value: string) {
      setSelectedColor(value);
      editor.chain().setColor(value).run();
   }

   // Alignment dropdown
   const alignDropdown = (
      <Popover open={alignOpen} onOpenChange={setAlignOpen}>
         <PopoverTrigger asChild>
            <ToolbarButton
               tooltip="Text alignment"
               aria-label="Text alignment"
               className="w-12"
               size={size}
               variant={variant}
               disabled={editorState.isAlignDisabled || isDocLocked}
               isActive={!!alignValue}
               disableHoverableContent
            >
               {currentAlignOption?.icon}
               <CaretDownIcon className="size-4.5" />
            </ToolbarButton>
         </PopoverTrigger>
         <PopoverContent align="start" className="w-40 p-1">
            {alignmentOptions.map((option) => (
               <button
                  key={option.value}
                  className={`flex w-full items-center rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                     editorState.textAlign === option.value ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                     handleAlign(editor, option.value);
                     setAlignOpen(false);
                  }}
                  disabled={editorState.isAlignDisabled || isDocLocked}
                  aria-label={option.name}
                  type="button"
               >
                  {option.icon}
                  <span className="ml-2 flex-1 text-left">{option.name}</span>
                  {editorState.textAlign === option.value && <Check className="ml-auto h-4 w-4 text-primary" />}
               </button>
            ))}
         </PopoverContent>
      </Popover>
   );

   // Highlight dropdown
   const highlightDropdown = (
      <Tooltip>
         <TooltipTrigger asChild>
            <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
               <PopoverTrigger asChild>
                  <ToolbarButton
                     tooltip="Highlight"
                     aria-label="Highlight"
                     className="w-9"
                     size={size}
                     variant={variant}
                     isActive={!!editorState.highlightColor}
                     disabled={editorState.isDisabled || isDocLocked}
                     disableHoverableContent
                  >
                     <HighlighterIcon className="size-4.5" />
                  </ToolbarButton>
               </PopoverTrigger>
               <PopoverContent align="start" className="w-40 p-1.5" ref={highlightMenuRef}>
                  <div className="flex flex-col gap-1" role="menu">
                     <Button
                        onClick={removeHighlight}
                        aria-label="Remove highlight"
                        tabIndex={0}
                        type="button"
                        role="menuitem"
                        data-style="ghost"
                        disabled={editorState.isDisabled || isDocLocked}
                        className="mb-1 flex w-full items-center gap-2 rounded bg-muted bg-primary/80 px-2 py-1 text-xs"
                        style={{ minHeight: 28 }}
                     >
                        <BanIcon className="h-4 w-4" />
                        <span>Remove highlight</span>
                     </Button>
                     <Separator className="my-1" />
                     <HighlightPicker
                        colors={HIGHLIGHT_COLORS}
                        selectedColor={editorState.highlightColor}
                        onColorChange={(value) => {
                           editor.chain().focus().setHighlight({ color: value }).run();
                           setHighlightOpen(false);
                        }}
                        selectedIndex={0}
                        disabled={editorState.isDisabled || isDocLocked}
                     />
                  </div>
               </PopoverContent>
            </Popover>
         </TooltipTrigger>
         <TooltipContent side="bottom">Highlight</TooltipContent>
      </Tooltip>
   );

   return (
      <div className="flex items-center gap-1">
         {alignDropdown}
         {highlightDropdown}
         <Popover>
            <PopoverTrigger asChild>
               <ToolbarButton
                  tooltip="Text color"
                  aria-label="Text color"
                  className="w-12"
                  size={size}
                  variant={variant}
                  disabled={editorState.isDisabled || isDocLocked}
                  disableHoverableContent
               >
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     width="24"
                     height="24"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     className="size-4.5"
                     style={{ color: selectedColor }}
                  >
                     <path d="M4 20h16" />
                     <path d="m6 16 6-12 6 12" />
                     <path d="M8 12h8" />
                  </svg>
                  <CaretDownIcon className="size-4.5" />
               </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-full">
               <div className="space-y-1.5">
                  {COLORS.map((palette, index) => (
                     <ColorPicker
                        key={index}
                        palette={palette}
                        inverse={palette.inverse}
                        selectedColor={selectedColor}
                        onColorChange={handleColorChange}
                     />
                  ))}
               </div>
            </PopoverContent>
         </Popover>
      </div>
   );
};

SectionThree.displayName = "SectionThree";

export default SectionThree;
