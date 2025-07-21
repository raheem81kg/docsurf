import { Sidebar, SidebarContent, SidebarRail, useSidebar } from "@docsurf/ui/components/sidebar";
import { useSandStateStore } from "@/store/sandstate";
import { useCallback, useEffect } from "react";
import React from "react";
import { INNER_RIGHT_SIDEBAR_COOKIE_NAME, SIDEBAR_COOKIE_MAX_AGE } from "@/utils/constants";
import { Chat } from "../right-inner/chat/chat";
import { useChatStore } from "../right-inner/chat/lib/chat-store";

export const RightSidebar = ({ r_sidebar_state, toggle_r_sidebar }: { r_sidebar_state: boolean; toggle_r_sidebar: () => void }) => {
   const { setOpen, setOpenMobile, open, openMobile, isMobile } = useSidebar();
   const set_r_sidebar_state = useSandStateStore((s) => s.set_r_sidebar_state);
   // Get the current threadId from the chat store
   const threadId = useChatStore((s) => s.threadId);

   // Check if user is not signed in
   // const isUserNotSignedIn = !session?.user && !isPending;

   // Define handleRailClick as a stable callback with useCallback
   const handleRailClick = useCallback(() => {
      toggle_r_sidebar();
   }, [toggle_r_sidebar]);

   React.useEffect(() => {
      if (isMobile) {
         if (r_sidebar_state !== openMobile) {
            setOpenMobile(r_sidebar_state);
         }
      } else {
         if (r_sidebar_state !== open) {
            setOpen(r_sidebar_state);
         }
      }
      // Update cookie when state changes
      document.cookie = `${INNER_RIGHT_SIDEBAR_COOKIE_NAME}=${r_sidebar_state}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
   }, [r_sidebar_state, open, openMobile, isMobile]);

   useEffect(() => {
      const down = (e: KeyboardEvent) => {
         if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            set_r_sidebar_state(!r_sidebar_state);
         }
      };

      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
   }, [r_sidebar_state, set_r_sidebar_state]);

   return (
      <Sidebar side="right" set_r_sidebar_state={set_r_sidebar_state}>
         <SidebarContent className="scrollbar-hidden p-0">
            <React.Suspense fallback={<Loading />}>
               <Chat threadId={threadId} />
            </React.Suspense>
         </SidebarContent>
         <SidebarRail onToggle={handleRailClick} enableDrag sideForDrag="right" maxSidebarWidth={24} />
      </Sidebar>
   );
};

function Loading() {
   return (
      <div className="flex flex-col gap-2">
         {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="aspect-video h-12 w-full rounded-lg bg-muted/50" />
         ))}
      </div>
   );
}
