import { FileText, FolderPlus, SquarePen } from "lucide-react";
import * as React from "react";
import { cn } from "@docsurf/ui/lib/utils";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuPortal,
   DropdownMenuShortcut,
} from "@docsurf/ui/components/dropdown-menu";
import { Button } from "@docsurf/ui/components/button";
import { SidebarMenuItem } from "@docsurf/ui/components/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";

// Define supported file types with proper mime types
// const SUPPORTED_FILE_TYPES = [
//    {
//       extension: "pdf",
//       documentType: "application/pdf" as Database["public"]["Enums"]["document_type"],
//       label: "PDF Document",
//    },
// ];

interface CreateMenuProps {
   parentId?: string | null;
}

export function CreateMenu({ parentId = null }: CreateMenuProps) {
   const [isUploading, setIsUploading] = React.useState(false);
   const [open, setOpen] = React.useState(false);
   // const { handleCreateNote, handleCreateFolder, handleUploadFile } = useShortcuts();
   const isMobile = useIsMobile();

   // const onCreateDocument = React.useCallback(
   //    debounce(
   //       async () => {
   //          await handleCreateNote(parentId);
   //       },
   //       1000,
   //       { leading: true, trailing: false }
   //    ),
   //    [handleCreateNote, parentId]
   // );

   // const onCreateFolder = React.useCallback(
   //    debounce(
   //       async () => {
   //          await handleCreateFolder(parentId);
   //       },
   //       1000,
   //       { leading: true, trailing: false }
   //    ),
   //    [handleCreateFolder, parentId]
   // );

   // const onUploadFile = React.useCallback(
   //    (e: React.MouseEvent) => {
   //       e.stopPropagation();
   //       if (env.NEXT_PUBLIC_IS_UPLOAD_STORAGE_ENABLED) {
   //          handleUploadFile(parentId);
   //       }
   //    },
   //    [handleUploadFile, parentId]
   // );

   return (
      <SidebarMenuItem
         className={cn(
            "outline-none rounded-sm border-none transition-colors",
            isUploading && "opacity-50 cursor-not-allowed",
            open && "bg-accent"
         )}
      >
         <DropdownMenu open={open} onOpenChange={setOpen} modal>
            {!isMobile && (
               <Tooltip delayDuration={0} disableHoverableContent>
                  <TooltipTrigger asChild>
                     <DropdownMenuTrigger asChild>
                        <Button
                           type="button"
                           variant="ghost"
                           className={cn(
                              "bg-transparent border-none outline-none cursor-pointer rounded-sm !p-2 text-sidebar transition-colors hover:bg-accent/ dark:hover:bg-accent/50",
                              isUploading && "opacity-50 cursor-not-allowed",
                              open && "bg-doc-brand"
                           )}
                        >
                           <SquarePen className="text-brand" />
                        </Button>
                     </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={5}>
                     <p>Create doc (⌘⌥N)</p>
                  </TooltipContent>
               </Tooltip>
            )}
            {isMobile && (
               <DropdownMenuTrigger asChild>
                  <Button
                     type="button"
                     variant="ghost"
                     className={cn(
                        "bg-transparent border-none outline-none cursor-pointer rounded-sm !p-2.5 text-sidebar transition-colors hover:bg-accent/50",
                        isUploading && "opacity-50 cursor-not-allowed",
                        open && "bg-doc-brand"
                     )}
                  >
                     <SquarePen className="text-brand" />
                  </Button>
               </DropdownMenuTrigger>
            )}
            <DropdownMenuPortal>
               <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} align="start" className="w-56 bg-default p-1">
                  <DropdownMenuItem
                     className="outline-none rounded-t-sm rounded-b-none hover:bg-accent/50 transition-colors"
                     // onClick={onCreateDocument}
                  >
                     <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                           <FileText className="mr-2 size-3.5" />
                           Create Note
                        </div>
                        {!isMobile && <DropdownMenuShortcut>⌘⌥N</DropdownMenuShortcut>}
                     </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="outline-none rounded-none hover:bg-accent/50 transition-colors"
                     // onClick={onCreateFolder}
                  >
                     <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                           <FolderPlus className="mr-2 size-3.5" />
                           Create Folder
                        </div>
                        {!isMobile && <DropdownMenuShortcut>⌘⌥F</DropdownMenuShortcut>}
                     </div>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenuPortal>
         </DropdownMenu>
      </SidebarMenuItem>
   );
}
