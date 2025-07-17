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
// import { useRateLimit } from "@convex-dev/rate-limiter/react";
import { DOCUMENT_CREATION_RATE_LIMIT } from "@docsurf/utils/constants/constants";
import { useSession } from "@/hooks/auth-hooks";
import { Analytics } from "@/components/providers/posthog";

interface CreateMenuProps {
   parentId?: string | null;
}

export function CreateMenu({ parentId = null }: CreateMenuProps) {
   const [open, setOpen] = React.useState(false);
   const isMobile = useIsMobile();
   const [isPending, startTransition] = React.useTransition();
   const navigate = useNavigate();

   // Get workspaceId from current user
   const { data: session } = useSession();
   const user = useQuery(api.auth.getCurrentUser, session?.user?.id ? {} : "skip");
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;
   const createDocument = useMutation(api.documents.createDocument);

   // Rate limit for document creation
   // const { status } = useRateLimit(api.documents.getCreateDocumentRateLimit, {
   //    getServerTimeMutation: api.documents.getCreateDocumentServerTime,
   // });

   const topLevelDocs = useQuery(api.documents.fetchDocumentTree, workspaceId ? { workspaceId } : "skip");

   const throttledCreate = throttle(
      (type: "text/plain" | "folder") => {
         if (!workspaceId) return;
         // if (status && !status.ok) {
         //    showToast(
         //       (status as any).reason ||
         //          `Document creation rate limit reached (${DOCUMENT_CREATION_RATE_LIMIT} per day). Try again tomorrow.`,
         //       "error"
         //    );
         //    return;
         // }
         // Find min orderPosition among top-level docs
         let minOrder = 0;
         if (topLevelDocs && Array.isArray(topLevelDocs.data) && topLevelDocs.data.length > 0) {
            minOrder = Math.min(...topLevelDocs.data.map((d) => (typeof d.orderPosition === "number" ? d.orderPosition : 0)));
            minOrder = minOrder - 1;
         }
         startTransition(async () => {
            let loadingToastId: string | number | null = null;
            let timer: NodeJS.Timeout | null = null;
            let finished = false;
            try {
               // Start a 2s timer to show loading toast if not finished
               timer = setTimeout(() => {
                  if (!finished) {
                     loadingToastId = showToast("Creating document...", "warning", { duration: Number.POSITIVE_INFINITY });
                  }
               }, 2000);
               const doc = await createDocument({
                  workspaceId,
                  title: type === "text/plain" ? DEFAULT_TEXT_TITLE : DEFAULT_FOLDER_TITLE,
                  documentType: type,
                  parentId: undefined, // Top-level
                  orderPosition: minOrder,
               });
               finished = true;
               if (timer) clearTimeout(timer);
               if (loadingToastId) {
                  showToast(`${type === "text/plain" ? "Document" : "Folder"} created!`, "success", {
                     duration: 3000,
                     id: loadingToastId,
                  });
               }
               Analytics.track("create_document", { documentType: type, userEmail: session?.user?.email });
               if (type === "text/plain") {
                  navigate({ to: "/doc/$documentId", params: { documentId: doc.id } });
               }
               setOpen(false);
            } catch (err) {
               finished = true;
               if (timer) clearTimeout(timer);
               if (loadingToastId) {
                  showToast(
                     `Couldn't create ${type === "text/plain" ? "document" : "folder"}. Please check your connection and try again.`,
                     "error",
                     { duration: 4000, id: loadingToastId }
                  );
               } else {
                  showToast(
                     `Couldn't create ${type === "text/plain" ? "document" : "folder"}. Please check your connection and try again.`,
                     "error"
                  );
               }
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
                           size="sm"
                           type="button"
                           variant="ghost"
                           className={cn(
                              "bg-transparent border-none outline-none cursor-pointer rounded-sm !p-2 text-text-default hover:text-brand transition-colors hover:bg-accent dark:hover:bg-accent/50",
                              isPending && "opacity-50 cursor-not-allowed",
                              open && "bg-doc-brand"
                           )}
                           // disabled={status && !status.ok}
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
                     // disabled={status && !status.ok}
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
                     // disabled={status && !status.ok}
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
                     // disabled={status && !status.ok}
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
