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
import { useMutation } from "convex/react";
import { api } from "@docsurf/backend/convex/_generated/api";
import { DEFAULT_TEXT_TITLE, DEFAULT_FOLDER_TITLE } from "@/utils/constants";
import { useQuery } from "convex/react";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import throttle from "lodash/throttle";
import { useNavigate } from "@tanstack/react-router";

interface CreateMenuProps {
   parentId?: string | null;
}

export function CreateMenu({ parentId = null }: CreateMenuProps) {
   const [open, setOpen] = React.useState(false);
   const isMobile = useIsMobile();
   const [isPending, startTransition] = React.useTransition();
   const navigate = useNavigate();

   // Get workspaceId from current user
   const user = useQuery(api.auth.getCurrentUser, {});
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;
   const createDocument = useMutation(api.documents.createDocument);

   const throttledCreate = throttle(
      (type: "text/plain" | "folder") => {
         if (!workspaceId) return;
         startTransition(async () => {
            try {
               const doc = await createDocument({
                  workspaceId,
                  title: type === "text/plain" ? DEFAULT_TEXT_TITLE : DEFAULT_FOLDER_TITLE,
                  documentType: type,
                  parentId: undefined, // Top-level
                  orderPosition: -1, // -1 means at the top
               });
               if (type === "text/plain") {
                  navigate({ to: "/doc/$documentId", params: { documentId: doc.id } });
               }
               setOpen(false);
            } catch (err) {
               showToast(
                  `Couldn't create ${type === "text/plain" ? "document" : "folder"}. Please check your connection and try again.`,
                  "error"
               );
            }
         });
      },
      1000, // 1 second per create action
      { trailing: false }
   );

   return (
      <SidebarMenuItem
         className={cn(
            "outline-none rounded-sm border-none transition-colors",
            isPending && "opacity-50 cursor-not-allowed",
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
                              "bg-transparent border-none outline-none cursor-pointer rounded-sm !p-2 text-text-default hover:text-brand transition-colors hover:bg-accent/ dark:hover:bg-accent/50",
                              isPending && "opacity-50 cursor-not-allowed",
                              open && "bg-doc-brand"
                           )}
                        >
                           <SquarePen className="size-5 md:size-4 " />
                        </Button>
                     </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={5}>
                     <p>
                        Create doc
                        {/* (⌘⌥N) */}
                     </p>
                  </TooltipContent>
               </Tooltip>
            )}
            {isMobile && (
               <DropdownMenuTrigger asChild>
                  <Button
                     type="button"
                     variant="ghost"
                     className={cn(
                        "bg-transparent h-10 md:h-8 border-none outline-none cursor-pointer rounded-sm !p-2.5 text-sidebar transition-colors hover:bg-accent/50",
                        isPending && "opacity-50 cursor-not-allowed",
                        open && "bg-doc-brand"
                     )}
                  >
                     <SquarePen className="size-5.5 md:size-4 text-primary" />
                  </Button>
               </DropdownMenuTrigger>
            )}
            <DropdownMenuPortal>
               <DropdownMenuContent
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  align="start"
                  className="w-52 md:w-48 bg-background p-1"
                  alignOffset={isMobile ? -20 : 0}
               >
                  <DropdownMenuItem
                     className="outline-none rounded-t-sm rounded-b-none hover:bg-accent/50 transition-colors"
                     onClick={() => throttledCreate("text/plain")}
                  >
                     <div className="flex items-center justify-between w-full">
                        <div className="flex gap-1 items-center text-base md:text-sm">
                           <FileText className="mr-2 size-4" />
                           Create Note
                        </div>
                        {/* {!isMobile && <DropdownMenuShortcut>⌘⌥N</DropdownMenuShortcut>} */}
                     </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="outline-none rounded-none hover:bg-accent/50 transition-colors"
                     onClick={() => throttledCreate("folder")}
                  >
                     <div className="flex items-center justify-between w-full">
                        <div className="flex gap-1 items-center text-base md:text-sm">
                           <FolderPlus className="mr-2 size-4" />
                           Create Folder
                        </div>
                        {/* {!isMobile && <DropdownMenuShortcut>⌘⌥F</DropdownMenuShortcut>} */}
                     </div>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenuPortal>
         </DropdownMenu>
      </SidebarMenuItem>
   );
}
