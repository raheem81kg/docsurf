"use client";
import type { Editor } from "@tiptap/react";
import type { VariantProps } from "class-variance-authority";
import type { toggleVariants } from "@docsurf/ui/components/toggle";
import { useState } from "react";
import { ImageIcon } from "@radix-ui/react-icons";
import { ToolbarButton } from "../toolbar-button";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogTrigger } from "@docsurf/ui/components/dialog";
import { ImageEditBlock } from "./image-edit-block";

interface ImageEditDialogProps extends VariantProps<typeof toggleVariants> {
   editor: Editor;
   disableHoverableContent?: boolean;
   disabled?: boolean;
}

const ImageEditDialog = ({ editor, size, variant, disableHoverableContent = false, disabled = false }: ImageEditDialogProps) => {
   const [open, setOpen] = useState(false);

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
            <ToolbarButton
               isActive={editor.isActive("image")}
               tooltip="Image"
               aria-label="Image"
               size={size}
               variant={variant}
               disableHoverableContent={disableHoverableContent}
               disabled={disabled}
            >
               <ImageIcon className="size-5" />
            </ToolbarButton>
         </DialogTrigger>
         <DialogContent className="sm:max-w-lg">
            <DialogHeader>
               <DialogTitle>Select image</DialogTitle>
               <DialogDescription className="sr-only">Upload an image from your computer</DialogDescription>
            </DialogHeader>
            <ImageEditBlock editor={editor} close={() => setOpen(false)} />
         </DialogContent>
      </Dialog>
   );
};

export { ImageEditDialog };
