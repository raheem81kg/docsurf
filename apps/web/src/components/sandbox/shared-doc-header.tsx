import { Separator } from "@docsurf/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { Button } from "@docsurf/ui/components/button";
import { cn, isMac } from "@docsurf/ui/lib/utils";
import React, { Suspense, useRef } from "react";
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
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { Pencil } from "lucide-react";
import { useMutation } from "convex/react";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useSession } from "@/hooks/auth-hooks";
import { SparklesIcon, type SparklesIconHandle } from "@/components/assets/animated/sparkles";
import { api } from "@docsurf/backend/convex/_generated/api";

/**
 * Header component for the doc page, including breadcrumb, doc title (editable), and action buttons.
 * Shows a skeleton for the doc title while loading.
 */
const SharedDocHeader = () => {
   const isMobile = useIsMobile();
   const navigate = useNavigate();
   const params = useParams({ strict: false });
   const documentId = params?.documentId;
   const { data: doc, isLoading } = useQuery({
      ...convexQuery(api.documents.fetchPublicDocument, { documentId: documentId as Id<"documents"> }),
      enabled: !!documentId,
   });
   const session = useSession();
   const sparklesRef = useRef<SparklesIconHandle>(null);

   const isShortTitle = doc?.title?.length && doc?.title?.length < 10;
   const isLargeTitle = doc?.title?.length && doc?.title?.length > 12;
   const isEvenLargerTitle = doc?.title?.length && doc?.title?.length > 18;

   return (
      <header className="sticky top-0 flex h-[40px] shrink-0 items-center gap-2 px-3">
         <div className="flex-1 min-w-0 flex items-center gap-2">
            <Breadcrumb>
               <BreadcrumbList>
                  {/* Always show Documents on /doc, no separator */}
                  {/* <Link to="/doc">
                     <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1 truncate text-[13px]">Documents</BreadcrumbPage>
                     </BreadcrumbItem>
                  </Link>
                  <BreadcrumbSeparator /> */}
                  {/* Doc title breadcrumb (only on detail page) */}
                  <BreadcrumbItem>
                     <button
                        type="button"
                        className={cn(
                           "relative max-w-[250px] flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden h-7 justify-between gap-4",
                           isLargeTitle && "w-[250px]",
                           isEvenLargerTitle && "w-[180px]",
                           isShortTitle && "w-[90px]",
                           !isShortTitle && !isLargeTitle && !isEvenLargerTitle && "w-[120px]"
                        )}
                        aria-label={"Document title."}
                        disabled={true}
                     >
                        {isLoading ? (
                           <Skeleton className="h-5 w-[100px] md:w-[120px] lg:w-[180px] rounded-sm" />
                        ) : doc ? (
                           <p
                              className={cn(
                                 "w-full bg-transparent outline-none text-[13px] truncate",
                                 "select-none border-none shadow-none p-0 m-0 bg-transparent"
                              )}
                              aria-live={"polite"}
                              aria-disabled={true}
                           >
                              {doc.title || "Untitled"}
                           </p>
                        ) : null}
                     </button>
                  </BreadcrumbItem>
               </BreadcrumbList>
            </Breadcrumb>
         </div>

         <div className="flex items-center md:gap-[0.1875rem] gap-[0.725rem] ml-auto">
            <Button size="sm" data-sidebar="trigger" data-slot="sidebar-trigger" onClick={() => navigate({ to: "/doc" })}>
               {session?.user ? "Start Writing" : "Sign in"}
            </Button>
         </div>
      </header>
   );
};

const SharedDocHeaderComponent = () => (
   <Suspense fallback={<SharedDocHeader.Skeleton />}>
      <SharedDocHeader />
   </Suspense>
);

SharedDocHeader.Skeleton = function SharedDocHeaderSkeleton() {
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

export default SharedDocHeader;
