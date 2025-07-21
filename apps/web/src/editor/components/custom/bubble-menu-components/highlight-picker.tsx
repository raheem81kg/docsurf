// import * as React from "react";
// import type { Editor } from "@tiptap/react";
// import { useEditorState } from "@tiptap/react";
// import { CheckIcon } from "@radix-ui/react-icons";
// import { ToolbarButton } from "../../minimal-tiptap/components/toolbar-button";
// import { Popover, PopoverTrigger, PopoverContent } from "@docsurf/ui/components/popover";
// import { ToggleGroup, ToggleGroupItem } from "@docsurf/ui/components/toggle-group";
// import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
// import { Separator } from "@docsurf/ui/components/separator";
// import { Button } from "@docsurf/ui/components/button";
// import { Ban as BanIcon } from "lucide-react";
// // Using a simple highlighter icon since the custom one might not exist
// const HighlighterIcon = ({ className }: { className?: string }) => (
//    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path
//          strokeLinecap="round"
//          strokeLinejoin="round"
//          strokeWidth={2}
//          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
//       />
//    </svg>
// );

// // Highlight colors
// const HIGHLIGHT_COLORS = [
//    { value: "hsl(54 50% 25%)", label: "Yellow" },
//    { value: "#f5a623", label: "Orange" },
//    { value: "hsl(174 50% 25%)", label: "Teal" },
//    { value: "hsl(214 50% 25%)", label: "Blue" },
//    { value: "hsl(138 40% 25%)", label: "Green" },
//    { value: "hsl(330 50% 35%)", label: "Pink" },
//    { value: "hsl(270 50% 25%)", label: "Purple" },
//    { value: "hsl(0 50% 25%)", label: "Red" },
// ];

// interface HighlightButtonProps {
//    color: string;
//    label: string;
//    isSelected: boolean;
//    onClick: (value: string) => void;
//    tabIndex?: number;
//    dataHighlighted?: boolean;
//    disabled?: boolean;
// }

// function HighlightButton({ color, label, isSelected, onClick, tabIndex, dataHighlighted, disabled }: HighlightButtonProps) {
//    return (
//       <Tooltip disableHoverableContent={true}>
//          <TooltipTrigger asChild>
//             <ToggleGroupItem
//                tabIndex={tabIndex}
//                className="relative size-7 rounded-sm border border-border p-0"
//                value={color}
//                aria-label={label}
//                style={{ backgroundColor: color }}
//                onClick={(e) => {
//                   e.preventDefault();
//                   onClick(color);
//                }}
//                data-highlighted={dataHighlighted}
//                disabled={disabled}
//             >
//                {isSelected && <CheckIcon className="absolute inset-0 m-auto size-6 text-primary" style={{ color: "#222" }} />}
//             </ToggleGroupItem>
//          </TooltipTrigger>
//          <TooltipContent side="bottom">
//             <p>{label}</p>
//          </TooltipContent>
//       </Tooltip>
//    );
// }

// interface HighlightPickerProps {
//    colors: { value: string; label: string }[];
//    selectedColor: string;
//    onColorChange: (value: string) => void;
//    selectedIndex: number;
//    disabled?: boolean;
// }

// function HighlightColorPicker({ colors, selectedColor, onColorChange, selectedIndex, disabled }: HighlightPickerProps) {
//    return (
//       <ToggleGroup
//          type="single"
//          value={selectedColor}
//          onValueChange={(value: string) => {
//             if (value) onColorChange(value);
//          }}
//          className="grid grid-cols-4 place-items-center gap-1"
//       >
//          {colors.map((color, index) => (
//             <HighlightButton
//                key={color.value}
//                color={color.value}
//                label={color.label + " highlight color"}
//                isSelected={selectedColor === color.value}
//                onClick={onColorChange}
//                tabIndex={index === selectedIndex ? 0 : -1}
//                dataHighlighted={selectedIndex === index}
//                disabled={disabled}
//             />
//          ))}
//       </ToggleGroup>
//    );
// }

// interface BubbleMenuHighlightPickerProps {
//    editor: Editor;
// }

// export function HighlightPicker({ editor }: BubbleMenuHighlightPickerProps) {
//    const editorState = useEditorState({
//       editor,
//       selector: (context) => ({
//          highlightColor: context.editor.getAttributes("highlight")?.color || "",
//          isDisabled:
//             !context.editor ||
//             context.editor.isActive("code") ||
//             context.editor.isActive("codeBlock") ||
//             context.editor.isActive("imageUpload"),
//       }),
//    });

//    const [highlightOpen, setHighlightOpen] = React.useState(false);

//    function removeHighlight() {
//       if (!editor) return;
//       editor.chain().focus().unsetMark("highlight").run();
//       setHighlightOpen(false);
//    }

//    return (
//       <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
//          <PopoverTrigger asChild>
//             <ToolbarButton
//                tooltip="Highlight"
//                aria-label="Highlight"
//                className="h-8 w-8 p-0"
//                isActive={!!editorState.highlightColor}
//                disabled={editorState.isDisabled}
//             >
//                <HighlighterIcon className="size-4" />
//             </ToolbarButton>
//          </PopoverTrigger>
//          <PopoverContent align="start" className="w-40 p-1.5">
//             <div className="flex flex-col gap-1" role="menu">
//                <Button
//                   onClick={removeHighlight}
//                   aria-label="Remove highlight"
//                   type="button"
//                   role="menuitem"
//                   data-style="ghost"
//                   disabled={editorState.isDisabled}
//                   className="mb-1 flex w-full items-center gap-2 rounded bg-foreground px-2 py-1 text-xs"
//                   style={{ minHeight: 28 }}
//                >
//                   <BanIcon className="h-4 w-4" />
//                   <span>Remove highlight</span>
//                </Button>
//                <Separator className="my-1" />
//                <HighlightColorPicker
//                   colors={HIGHLIGHT_COLORS}
//                   selectedColor={editorState.highlightColor}
//                   onColorChange={(value: string) => {
//                      editor.chain().focus().setHighlight({ color: value }).run();
//                      setHighlightOpen(false);
//                   }}
//                   selectedIndex={0}
//                   disabled={editorState.isDisabled}
//                />
//             </div>
//          </PopoverContent>
//       </Popover>
//    );
// }
