import * as React from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { ToolbarButton } from "../../minimal-tiptap/components/toolbar-button";
import { Popover, PopoverTrigger, PopoverContent } from "@docsurf/ui/components/popover";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Check } from "lucide-react";

interface AlignmentOption {
   name: string;
   value: string;
   icon: React.ReactNode;
}

const alignmentOptions: AlignmentOption[] = [
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

interface BubbleMenuAlignmentPickerProps {
   editor: Editor;
   containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function AlignmentPicker({ editor, containerRef }: BubbleMenuAlignmentPickerProps) {
   const editorState = useEditorState({
      editor,
      selector: (context) => {
         // Determine current text alignment
         let textAlign = "left";
         if (context.editor.isActive({ textAlign: "center" })) textAlign = "center";
         else if (context.editor.isActive({ textAlign: "right" })) textAlign = "right";
         else if (context.editor.isActive({ textAlign: "justify" })) textAlign = "justify";

         return {
            textAlign,
            isAlignDisabled: context.editor.isActive("image") || context.editor.isActive("video") || !context.editor,
         };
      },
   });

   const [alignOpen, setAlignOpen] = React.useState(false);
   const alignValue = editorState.textAlign;
   const currentAlignOption = alignmentOptions.find((o) => o.value === alignValue);

   return (
      <Popover modal={true} open={alignOpen} onOpenChange={setAlignOpen}>
         <PopoverTrigger asChild>
            <ToolbarButton
               tooltip="Text alignment"
               aria-label="Text alignment"
               className="h-8 w-8 p-0 px-5"
               disabled={editorState.isAlignDisabled}
               isActive={!!alignValue}
            >
               {currentAlignOption?.icon}
               <CaretDownIcon className="size-3.5" />
            </ToolbarButton>
         </PopoverTrigger>
         <PopoverContent align="start" className="w-40 p-1 rounded-xl" container={containerRef?.current ?? undefined}>
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
                  disabled={editorState.isAlignDisabled}
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
}
