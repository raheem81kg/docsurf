import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarRail,
   useSidebar,
} from "@docsurf/ui/components/sidebar";
import { useSandStateStore } from "@/store/sandstate";
import { Command, ExternalLink, Home, Settings, ChevronsLeft, ImageIcon, Search, Trash2 } from "lucide-react";
import { NavUser } from "./nav-user/nav-user";
import { CreateMenu } from "./nav-user/create-menu";
import { Link } from "@tanstack/react-router";
import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";

import {
   InfoCard,
   InfoCardContent,
   InfoCardTitle,
   InfoCardDescription,
   InfoCardFooter,
   InfoCardDismiss,
   InfoCardAction,
} from "./info-card/info-card";
import Credits from "./credits";
import { Button, buttonVariants } from "@docsurf/ui/components/button";
import { LEFT_SIDEBAR_COOKIE_NAME } from "@/utils/constants";
import { cn } from "@docsurf/ui/lib/utils";
import { CommandK } from "../right-inner/chat/commandkdocs";
import { NewFolderButton } from "../right-inner/chat/threads/new-folder-button";
import { FolderItem } from "../right-inner/chat/threads/folder-item";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useDiskCachedQuery } from "../right-inner/chat/lib/convex-cached-query";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { TrashPopover } from "./trash-popover";
import { SortableTree } from "./_tree_components/SortableTree";
import { Usage } from "./usage";

const data = {
   navMain: [
      {
         title: "Home",
         url: "/doc",
         icon: Home,
      },
   ],

   navSecondary: [
      {
         title: "Settings",
         icon: Settings,
         id: "settings",
      },
      // {
      //    title: "Give Feedback",
      //    icon: MessageCircleQuestion,
      //    id: "feedback",
      // },
   ],
};

const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Hydration fix: only render InfoCard after mount
const useMounted = () => {
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   return mounted;
};

export const LeftSidebar = ({
   l_sidebar_state,
   toggle_l_sidebar,
   initialOpen,
}: {
   l_sidebar_state: boolean;
   toggle_l_sidebar: () => void;
   initialOpen?: boolean;
}) => {
   const { setOpen, setOpenMobile, toggleSidebar, open, isMobile, openMobile } = useSidebar();
   const set_l_sidebar_state = useSandStateStore((s) => s.set_l_sidebar_state);
   const [commandKOpen, setCommandKOpen] = useState(false);
   const [infoCardDismissed, setInfoCardDismissed] = useState(false);
   const mounted = useMounted();
   const user = useQuery(convexQuery(api.auth.getCurrentUser, {}));

   // SCROLL GRADIENT LOGIC (copied from threads-sidebar)
   const [showGradient, setShowGradient] = useState(false);
   const scrollContainerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
         const { scrollTop, scrollHeight, clientHeight } = container;
         const hasScrollableContent = scrollHeight > clientHeight;
         const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 5;
         setShowGradient(hasScrollableContent && !isScrolledToBottom);
      };

      handleScroll();
      container.addEventListener("scroll", handleScroll);

      const resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(container);

      const mutationObserver = new MutationObserver(handleScroll);
      mutationObserver.observe(container, {
         childList: true,
         subtree: true,
      });

      return () => {
         container.removeEventListener("scroll", handleScroll);
         resizeObserver.disconnect();
         mutationObserver.disconnect();
      };
   }, []);

   // Get projects
   const projects = useDiskCachedQuery(
      api.folders.getUserProjects,
      {
         key: "projects",
         default: [],
         forceCache: true,
      },
      user.data?._id && !user.isLoading ? {} : "skip"
   );
   // Sync the sidebar state from useSandStateStore to useSidebar (store -> UI)
   React.useEffect(() => {
      if (isMobile) {
         if (l_sidebar_state !== openMobile) {
            setOpenMobile(l_sidebar_state);
         }
      } else {
         if (l_sidebar_state !== open) {
            setOpen(l_sidebar_state);
         }
      }
      // Update cookie when state changes
      document.cookie = `${LEFT_SIDEBAR_COOKIE_NAME}=${l_sidebar_state}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
   }, [l_sidebar_state, open, openMobile, isMobile]);

   // Sync with localStorage on mount (client only)
   useEffect(() => {
      if (mounted) {
         setInfoCardDismissed(localStorage.getItem("docsurf-beta-announcement") === "dismissed");
      }
   }, [mounted]);

   // Callback to dismiss InfoCard (used after feedback submission)
   const handleInfoCardDismiss = useCallback(() => {
      setInfoCardDismissed(true);
      if (typeof window !== "undefined") {
         localStorage.setItem("docsurf-beta-announcement", "dismissed");
      }
   }, []);

   // Custom handler for the rail click that updates both systems
   const handleRailClick = () => {
      toggle_l_sidebar();
   };

   useEffect(() => {
      const down = (e: KeyboardEvent) => {
         if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            set_l_sidebar_state(!l_sidebar_state);
         }
      };

      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
   }, [l_sidebar_state, set_l_sidebar_state]);

   return (
      <Sidebar className="border-r bg-destructive" set_l_sidebar_state={set_l_sidebar_state}>
         <SidebarHeader className="gap-3 md:gap-2">
            <SidebarMenu className="flex items-center justify-between gap-1.5 flex-row">
               <div className="">
                  <NavUser />
               </div>

               {!isMobile && (
                  <div className="group ml-auto">
                     <Button
                        className="bg-transparent border-none opacity-0 group-hover:opacity-100 transition-all duration-200 outline-none cursor-pointer rounded-sm !p-2 text-sidebar -translate-x-[0.5px] group-hover:translate-x-0"
                        variant="ghost"
                        onClick={() => set_l_sidebar_state(false)}
                     >
                        <ChevronsLeft className="size-4.5 transition-opacity text-text-default" />
                     </Button>
                  </div>
               )}

               <CreateMenu />
            </SidebarMenu>

            <Button
               onClick={() => {
                  setCommandKOpen(true);
               }}
               variant="outline"
               className="h-10 md:h-8"
            >
               <Search className="size-5.5 md:size-4" />
               Search documents
               <div className="ml-auto flex items-center gap-1 text-xs">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-muted-foreground">
                     <span className="text-sm">⌘</span>
                     <span className="text-xs">K</span>
                  </kbd>
               </div>
            </Button>
            <div className="">
               <Link
                  to="/doc/library"
                  className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-full justify-start md:text-sm text-base")}
               >
                  <ImageIcon className="size-5 md:size-4" />
                  Library
               </Link>
            </div>

            <SidebarMenu className="gap-0.5">{/* <NavMain items={navMainWithActive} onSettingsClick={openModal} /> */}</SidebarMenu>
         </SidebarHeader>

         <SidebarContent ref={scrollContainerRef} className="scrollbar-hide">
            <div className="flex-1 flex flex-col min-h-0">
               {/* Folders Section */}
               {/* <SidebarGroup>
                  <SidebarGroupLabel className="pr-0">
                     Folders
                     <div className="flex-grow" />
                     <NewFolderButton onClick={() => setOpenMobile(false)} />
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                     <SidebarMenu>
                        {Array.isArray(projects) &&
                           projects.map((project) => {
                              return <FolderItem key={project._id} project={project} numThreads={project.threadCount} />;
                           })}
                     </SidebarMenu>
                  </SidebarGroupContent>
               </SidebarGroup> */}
               {/* <OfflineStatus /> */}
               <SidebarGroup className="h-full">
                  <SidebarGroupLabel className="pr-0 font-medium md:text-sm text-base">
                     <Link to="/doc">Documents</Link>

                     <div className="flex-grow" />
                     <NewFolderButton onClick={() => setOpenMobile(false)} />
                  </SidebarGroupLabel>
                  <SidebarGroupContent className="h-full">
                     <SidebarMenu className=" h-full mt-1">
                        {/* <SidebarMenuItem> TBI</SidebarMenuItem> */}
                        <SortableTree collapsible indicator removable />
                     </SidebarMenu>
                  </SidebarGroupContent>
               </SidebarGroup>

               {/* <Suspense fallback={<TreeSkeleton />}>
               <SortableTree collapsible indicator removable />
            </Suspense> */}
            </div>
            {showGradient && (
               <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-20 bg-gradient-to-t from-sidebar via-sidebar/60 to-transparent" />
            )}
         </SidebarContent>

         <SidebarFooter className="pt-0">
            <TrashPopover>
               <Button variant="ghost" size="sm" aria-label="Open trash menu" className="justify-start">
                  <span className="md:text-sm text-base">Trash</span>
                  <Trash2 className="size-5 md:size-4" />
               </Button>
            </TrashPopover>
            <InfoCard
               className="bg-background z-10"
               storageKey="docsurf-beta-announcement"
               dismissType="forever"
               forceDismiss={infoCardDismissed}
               onDismissed={handleInfoCardDismiss}
            >
               <InfoCardContent>
                  <div className="relative">
                     <div className="absolute -top-4 -right-4 w-[14px] h-[14px] bg-primary rounded-full animate-ping" />
                     <div className="absolute -top-4 -right-4 w-[14px] h-[14px] bg-primary rounded-full" />
                     <InfoCardTitle className="text-primary">DocSurf is now in beta</InfoCardTitle>
                     <InfoCardDescription>We are currently in beta and we would love to hear from you.</InfoCardDescription>
                     <InfoCardFooter>
                        <InfoCardDismiss>Dismiss</InfoCardDismiss>
                        <InfoCardAction>
                           <a
                              href="https://docsurf.featurebase.app/"
                              rel="noopener noreferrer"
                              target="_blank"
                              className="flex flex-row items-center gap-1 underline"
                           >
                              Give Feedback <ExternalLink size={12} />
                           </a>
                        </InfoCardAction>
                     </InfoCardFooter>
                  </div>
               </InfoCardContent>
            </InfoCard>

            {/* <NavSecondary
               items={data.navSecondary
                  .filter((item) => !(item.id === "feedback" && infoCardDismissed))
                  .map((item) => ({
                     ...item,
                     onClick:
                        item.id === "settings"
                           ? () => handleNavSecondary("settings")
                           : item.id === "feedback"
                             ? () => handleNavSecondary("feedback")
                             : undefined,
                  }))}
               className="mt-auto"
            /> */}
            <div className="relative flex flex-col justify-end">
               <Usage />
            </div>
            <SidebarMenu className="hidden lg:block">
               <SidebarMenuItem>
                  <Credits />
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarFooter>
         <SidebarRail onToggle={handleRailClick} sideForDrag="left" enableDrag maxSidebarWidth={20} />
         <CommandK open={commandKOpen} onOpenChange={setCommandKOpen} />
      </Sidebar>
   );
};
