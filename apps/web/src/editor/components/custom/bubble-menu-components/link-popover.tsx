import * as React from "react";
import { Link, LinkIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@docsurf/ui/components/popover";
import { Input } from "@docsurf/ui/components/input";
import type { Editor } from "@tiptap/react";
import { ToolbarButton } from "../../minimal-tiptap/components/toolbar-button";

interface LinkPopoverProps {
   editor: Editor;
   disabled?: boolean;
   containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function LinkPopover({ editor, disabled = false, containerRef }: LinkPopoverProps) {
   const [isOpen, setIsOpen] = React.useState(false);
   const [url, setUrl] = React.useState("");
   const inputRef = React.useRef<HTMLInputElement>(null);

   const isLinkActive = editor.isActive("link");
   const currentLinkUrl = editor.getAttributes("link").href || "";

   React.useEffect(() => {
      if (isOpen) {
         // Set the current URL if editing an existing link
         setUrl(currentLinkUrl);
         // Focus the input after a short delay to ensure the popover is rendered
         setTimeout(() => {
            inputRef.current?.focus();
         }, 0);
      }
   }, [isOpen, currentLinkUrl]);

   const handleSubmit = React.useCallback(
      (e: React.FormEvent) => {
         e.preventDefault();

         if (!url.trim()) {
            // Remove link if URL is empty
            editor.chain().focus().unsetLink().run();
         } else {
            // Set or update the link
            if (isLinkActive) {
               // Update existing link
               editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            } else {
               // Create new link
               const { from, to } = editor.state.selection;
               const text = editor.state.doc.textBetween(from, to, " ");

               editor
                  .chain()
                  .focus()
                  .insertContent({
                     type: "text",
                     text: text || url,
                     marks: [
                        {
                           type: "link",
                           attrs: { href: url },
                        },
                     ],
                  })
                  .run();
            }
         }

         setIsOpen(false);
         setUrl("");
      },
      [editor, url, isLinkActive]
   );

   const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
         setIsOpen(false);
         setUrl("");
      }
   }, []);

   return (
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
         <PopoverTrigger asChild>
            <ToolbarButton isActive={isLinkActive} tooltip="Insert link" disabled={disabled} disableHoverableContent={true}>
               <Link className="size-4" />
            </ToolbarButton>
         </PopoverTrigger>
         <PopoverContent
            align="end"
            side="top"
            className="w-max bg-background rounded-none border-none !p-0 shadow-none"
            sideOffset={8}
            onCloseAutoFocus={(e) => e.preventDefault()}
            container={containerRef?.current ?? undefined}
         >
            <form onSubmit={handleSubmit}>
               <div className="isolate flex rounded-lg">
                  <div className="relative">
                     <div className="absolute inset-y-0 left-1.5 z-10 flex items-center">
                        <LinkIcon className="h-3 w-3 stroke-[2.5] text-muted-foreground" />
                     </div>
                     <Input
                        ref={inputRef}
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="https://example.com"
                        className="block h-8 w-56 rounded-lg border border-border px-2 py-1.5 pl-6 pr-6 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-0"
                     />
                  </div>
               </div>
            </form>
         </PopoverContent>
      </Popover>
   );
}
