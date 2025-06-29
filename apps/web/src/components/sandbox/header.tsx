import { Separator } from "@docsurf/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { Button } from "@docsurf/ui/components/button";
import { cn, isMac } from "@docsurf/ui/lib/utils";
import React, { Suspense } from "react";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { VscLayoutSidebarLeft, VscLayoutSidebarRight, VscSettingsGear } from "react-icons/vsc";
import { useSandStateStore } from "@/store/sandstate";
import { useCurrentDocument } from "./left/_tree_components/SortableTree";
import { Link, useLocation, useNavigate, useParams } from "@tanstack/react-router";
import {
   Breadcrumb,
   BreadcrumbItem,
   BreadcrumbLink,
   BreadcrumbList,
   BreadcrumbPage,
   BreadcrumbSeparator,
} from "@docsurf/ui/components/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useConvexTree } from "./left/_tree_components/use-convex-tree";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { Pencil } from "lucide-react";
import { useMutation } from "convex/react";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
/**
 * Header component for the doc page, including breadcrumb, doc title (editable), and action buttons.
 * Shows a skeleton for the doc title while loading.
 */
const HeaderContent = () => {
   const isMobile = useIsMobile();
   const l_sidebar_state = useSandStateStore((s) => s.l_sidebar_state);
   const ir_sidebar_state = useSandStateStore((s) => s.ir_sidebar_state);
   const toggle_l_sidebar = useSandStateStore((s) => s.toggle_l_sidebar);
   const toggle_ir_sidebar = useSandStateStore((s) => s.toggle_ir_sidebar);
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc } = useCurrentDocument(user);
   const { isLoading: isTreeLoading } = useConvexTree({
      workspaceId: user?.workspaces?.[0]?.workspace?._id as Id<"workspaces">,
   });
   const pathname = useLocation().pathname;
   const documentId = useParams({ strict: false }).documentId;
   const isPreciselyDocPage = pathname === "/doc";
   const isDocPage = pathname.startsWith("/doc");
   const isDocDetailPage = isDocPage && documentId;
   const isBothSidebarsOpen = l_sidebar_state && ir_sidebar_state;
   const isEitherSidebarOpen = l_sidebar_state || ir_sidebar_state;
   // Helper for Documents breadcrumb visibility
   const showDocumentsBreadcrumbClass = isMobile
      ? undefined
      : isBothSidebarsOpen
      ? "hidden xl:block"
      : isEitherSidebarOpen
      ? "hidden lg:block"
      : undefined;
   const showDocumentsSeparatorClass = showDocumentsBreadcrumbClass;
   const [editing, setEditing] = React.useState(false);
   const [title, setTitle] = React.useState("");
   const inputRef = React.useRef<HTMLInputElement>(null);
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;
   const renameDocument = useMutation(api.documents.renameDocument).withOptimisticUpdate((localStore, args) => {
      // Optimistically update the document tree
      const tree = localStore.getQuery(api.documents.fetchDocumentTree, {
         workspaceId: args.workspaceId,
      });
      if (tree && Array.isArray(tree.data)) {
         localStore.setQuery(
            api.documents.fetchDocumentTree,
            { workspaceId: args.workspaceId },
            {
               data: tree.data.map((doc) => (doc._id === args.id ? { ...doc, title: args.title } : doc)),
            }
         );
      }
      // Optimistically update the individual document if loaded
      const doc = localStore.getQuery(api.documents.fetchDocumentById, {
         workspaceId: args.workspaceId,
         id: args.id,
      });
      if (doc) {
         localStore.setQuery(
            api.documents.fetchDocumentById,
            { workspaceId: args.workspaceId, id: args.id },
            { ...doc, title: args.title }
         );
      }
   });
   React.useEffect(() => {
      if (editing && inputRef.current) {
         inputRef.current.focus();
         inputRef.current.select();
      }
   }, [editing]);
   React.useEffect(() => {
      setTitle(doc?.title || DEFAULT_TEXT_TITLE);
   }, [doc?.title]);
   const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(true);
   };
   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
   };
   const handleInputBlur = async () => {
      if (!editing) return;
      await handleSave();
   };
   const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
         await handleSave();
      } else if (e.key === "Escape") {
         setTitle(doc?.title || DEFAULT_TEXT_TITLE);
         setEditing(false);
      }
   };
   const handleSave = async () => {
      if (!doc || !workspaceId) {
         setEditing(false);
         return;
      }
      const trimmed = title.trim() || DEFAULT_TEXT_TITLE;
      if (trimmed !== doc.title) {
         await renameDocument({ workspaceId, id: doc._id, title: trimmed });
      }
      setEditing(false);
   };
   return (
      <header className="sticky top-0 flex h-[46px] shrink-0 items-center gap-2 border-b px-3">
         <Tooltip delayDuration={0} disableHoverableContent={!isMobile}>
            <TooltipTrigger asChild>
               <Button
                  data-sidebar="trigger"
                  data-slot="sidebar-trigger"
                  variant="ghost"
                  size="icon"
                  className={cn(
                     "size-7 text-primary cursor-pointer",
                     "md:hidden", // Hide on desktop
                     "flex items-center" // Ensure consistent layout
                  )}
                  onClick={() => {
                     toggle_l_sidebar();
                  }}
                  onFocus={(e) => e.currentTarget.blur()}
               >
                  <VscLayoutSidebarLeft size={16} className="!size-4" />
                  <span className="sr-only">Toggle Sidebar</span>
               </Button>
            </TooltipTrigger>
            {!isMobile && (
               <TooltipContent sideOffset={7} side="right" className=" flex-row items-center hidden md:flex">
                  <kbd className="pointer-events-none select-none items-center gap-1 rounded font-mono text-[10px] font-medium opacity-100 flex">
                     <span className={cn(isMac ? "block" : "hidden")}>⌘</span>
                     <span className={cn(!isMac ? "block" : "hidden")}>Ctrl</span>B
                  </kbd>
               </TooltipContent>
            )}
         </Tooltip>
         <Separator orientation="vertical" className="mr-2 !h-4 md:hidden" />

         <div className="flex-1 min-w-0 flex items-center gap-2">
            <Breadcrumb>
               <BreadcrumbList>
                  {/* Always show Documents on /doc, no separator */}
                  {isPreciselyDocPage && (
                     // TODO: implement this
                     // <Link to="/doc">
                     <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1 truncate text-[13px]">Documents</BreadcrumbPage>
                     </BreadcrumbItem>
                     // </Link>
                  )}
                  {/* On doc detail page, show Documents and separator with responsive hiding and breakpoints */}
                  {!isMobile && isDocDetailPage && (
                     <>
                        <Link to="/doc" className={showDocumentsBreadcrumbClass}>
                           <BreadcrumbItem>
                              <BreadcrumbPage className="line-clamp-1 truncate text-[13px]">Documents</BreadcrumbPage>
                           </BreadcrumbItem>
                        </Link>
                        <BreadcrumbSeparator className={showDocumentsSeparatorClass} />
                     </>
                  )}
                  {/* Doc title breadcrumb (only on detail page) */}
                  {isDocDetailPage && (
                     <BreadcrumbItem>
                        <button
                           type="button"
                           className={cn(
                              "relative w-[160px] 3xl:w-[200px] max-w-[250px] -ml-1 flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden h-7 hover:bg-accent/80 justify-between gap-4 border",
                              editing ? "bg-muted/50 border-primary" : "border-transparent",
                              doc ? "cursor-pointer" : "cursor-default"
                           )}
                           onClick={() => {
                              if (!editing && !isTreeLoading) {
                                 setEditing(true);
                              }
                           }}
                           aria-label={editing ? "Editing document title" : "Document title. Click to edit."}
                           aria-live={editing ? undefined : "polite"}
                           disabled={isTreeLoading}
                        >
                           {isTreeLoading ? (
                              <Skeleton className="h-5 w-[100px] md:w-[120px] lg:w-[180px] rounded-sm" />
                           ) : doc ? (
                              <>
                                 <input
                                    type="text"
                                    value={title}
                                    readOnly={!editing}
                                    onChange={editing ? handleInputChange : undefined}
                                    onKeyDown={editing ? handleInputKeyDown : undefined}
                                    ref={inputRef}
                                    onBlur={editing ? handleInputBlur : undefined}
                                    className={cn(
                                       "w-full bg-transparent outline-none text-[13px] truncate",
                                       editing
                                          ? "border-none"
                                          : "cursor-pointer select-none border-none shadow-none p-0 m-0 bg-transparent"
                                    )}
                                    placeholder="Enter title..."
                                    maxLength={100}
                                    aria-label={editing ? "Editing document title" : "Document title. Click to edit."}
                                    aria-live={editing ? "polite" : undefined}
                                 />
                                 {editing && <VisuallyHidden>Editing document title</VisuallyHidden>}
                              </>
                           ) : null}
                        </button>
                     </BreadcrumbItem>
                  )}
               </BreadcrumbList>
            </Breadcrumb>
         </div>

         <div className="flex items-center md:gap-[0.1875rem] gap-[0.725rem] ml-auto">
            <Tooltip delayDuration={0} disableHoverableContent={true}>
               <TooltipTrigger asChild>
                  <Button
                     data-sidebar="trigger"
                     data-slot="sidebar-trigger"
                     variant="ghost"
                     size="icon"
                     className={cn(
                        "size-7 text-primary cursor-pointer",
                        "hidden md:flex", // Show only on desktop
                        "items-center" // Ensure consistent layout
                     )}
                     onClick={() => {
                        toggle_l_sidebar();
                     }}
                     onFocus={(e) => e.currentTarget.blur()}
                  >
                     <VscLayoutSidebarLeft size={16} className="!size-4" />
                     <span className="sr-only">Toggle Left Sidebar</span>
                  </Button>
               </TooltipTrigger>
               {!isMobile && (
                  <TooltipContent sideOffset={3} side="left" className="flex-row items-center hidden md:flex">
                     <kbd className="pointer-events-none select-none items-center gap-1 rounded font-mono text-[10px] font-medium opacity-100 flex">
                        <span className={cn(isMac ? "block" : "hidden")}>⌘</span>
                        <span className={cn(!isMac ? "block" : "hidden")}>Ctrl</span>B
                     </kbd>
                  </TooltipContent>
               )}
            </Tooltip>

            <Button
               data-sidebar="trigger"
               data-slot="sidebar-trigger"
               variant="ghost"
               size="icon"
               disabled={doc?.isLocked || doc?.isDeleted}
               className={cn("size-7 text-primary cursor-pointer")}
               onClick={() => {
                  toggle_ir_sidebar();
               }}
               onFocus={(e) => e.currentTarget.blur()}
            >
               <VscLayoutSidebarRight className="!size-4" size={16} />
               <span className="sr-only">Toggle Inner Right Sidebar</span>
            </Button>
         </div>
      </header>
   );
};

const Header = () => (
   <Suspense fallback={<Header.Skeleton />}>
      <HeaderContent />
   </Suspense>
);

Header.Skeleton = function HeaderSkeleton() {
   return (
      <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b px-4">
         <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2 w-[180px]">
               <Skeleton className="h-4 w-16 bg-background/5" />
               <Skeleton className="h-4 w-4 bg-background/5" />
               <Skeleton className="h-4 w-24 bg-background/5" />
            </div>
            {/* Doc title skeleton */}
            <Skeleton className="h-4 w-[70px] lg:w-[120px] bg-background/5 ml-2" />
            {/* Save status skeleton */}
            <Skeleton className="h-4 w-12 bg-background/5 ml-1" />
         </div>
         <div className="flex items-center gap-1 ml-auto">
            {/* More menu button skeleton */}
            <Skeleton className="size-8 rounded-full bg-background/5" />
            {/* Ask AI button skeleton */}
            <Skeleton className="h-8 w-20 rounded-sm bg-background/5" />
         </div>
      </header>
   );
};

export default Header;
