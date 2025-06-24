import {
   Sidebar,
   SidebarFooter,
   SidebarGroupLabel,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarRail,
   useSidebar,
} from "@docsurf/ui/components/sidebar";
import { useSandStateStore } from "@/store/sandstate";
import { Command, ExternalLink, Home, Settings, ChevronsLeft } from "lucide-react";
import { NavUser } from "./nav-user/nav-user";
import { CreateMenu } from "./nav-user/create-menu";
import { Link } from "@tanstack/react-router";
import React, { Suspense, useEffect, useState, useCallback } from "react";

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
import { Button } from "@docsurf/ui/components/button";
import { LEFT_SIDEBAR_COOKIE_NAME } from "@/utils/constants";

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

   const [infoCardDismissed, setInfoCardDismissed] = useState(false);
   const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
   const mounted = useMounted();

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

   // When feedback is submitted, dismiss InfoCard and close dialog
   const handleFeedbackSubmitted = useCallback(() => {
      handleInfoCardDismiss();
      setFeedbackDialogOpen(false);
   }, [handleInfoCardDismiss]);

   // Open FeedbackDialog
   const openFeedbackDialog = useCallback(() => {
      setFeedbackDialogOpen(true);
   }, []);

   // Custom handler for the rail click that updates both systems
   const handleRailClick = () => {
      toggle_l_sidebar();
   };

   return (
      <Sidebar className="border-r bg-red-400" set_l_sidebar_state={set_l_sidebar_state}>
         <SidebarHeader>
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
            <SidebarMenu className="gap-0.5">{/* <NavMain items={navMainWithActive} onSettingsClick={openModal} /> */}</SidebarMenu>
         </SidebarHeader>

         <div className="flex-1 flex flex-col min-h-0">
            {/* <OfflineStatus /> */}
            <Link to="/doc">
               <SidebarGroupLabel className="font-medium px-4">Documents</SidebarGroupLabel>
            </Link>
            {/* <Suspense fallback={<TreeSkeleton />}>
               <SortableTree collapsible indicator removable />
            </Suspense> */}
         </div>

         <SidebarFooter className="pt-0">
            {/* Always render InfoCard after mount; let InfoCard handle its own dismissal animation */}
            {mounted && (
               <InfoCard
                  className="bg-default z-10"
                  storageKey="docsurf-beta-announcement"
                  dismissType="forever"
                  forceDismiss={infoCardDismissed}
                  onDismissed={handleInfoCardDismiss}
               >
                  <InfoCardContent>
                     <div className="relative">
                        <div className="absolute -top-4 -right-4 w-[14px] h-[14px] bg-blue-500 rounded-full animate-ping" />
                        <div className="absolute -top-4 -right-4 w-[14px] h-[14px] bg-blue-500 rounded-full" />
                        <InfoCardTitle className="text-primary">DocSurf is now in beta</InfoCardTitle>
                        <InfoCardDescription>We are currently in beta and we would love to hear from you.</InfoCardDescription>
                        <InfoCardFooter>
                           <InfoCardDismiss>Dismiss</InfoCardDismiss>
                           <InfoCardAction>
                              <button
                                 type="button"
                                 className="flex flex-row items-center gap-1 underline"
                                 onClick={openFeedbackDialog}
                              >
                                 Give Feedback <ExternalLink size={12} />
                              </button>
                           </InfoCardAction>
                        </InfoCardFooter>
                     </div>
                  </InfoCardContent>
               </InfoCard>
            )}

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
            <div className="relative flex flex-col justify-end">{/* <Usage /> */}</div>
            <SidebarMenu>
               <SidebarMenuItem>
                  {/* <SidebarMenuButton size="lg" asChild>
                     <Link href="/doc">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                           <Command className="size-4" />
                           <Image src="/assets/logo/logo.svg" alt="docsurf" width={32} height={32} className="block dark:hidden" />
                           <Image
                              src="/logo-dark.svg"
                              alt="docsurf"
                              width={32}
                              height={32}
                              className="hidden dark:block"
                           />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                           <span className="truncate font-semibold">DocSurf</span>
                           <span className="truncate text-xs">Write with AI</span>
                        </div>
                     </Link>
                  </SidebarMenuButton> */}

                  <Credits />
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarFooter>
         <SidebarRail onToggle={handleRailClick} sideForDrag="left" enableDrag maxSidebarWidth={20} />
      </Sidebar>
   );
};
