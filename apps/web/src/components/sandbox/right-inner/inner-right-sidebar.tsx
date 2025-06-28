import { Sidebar, SidebarContent, SidebarRail, useSidebar } from "@docsurf/ui/components/sidebar";
import { useSandStateStore } from "@/store/sandstate";
import { useCallback, useEffect } from "react";
import React from "react";
import { INNER_RIGHT_SIDEBAR_COOKIE_NAME, SIDEBAR_COOKIE_MAX_AGE } from "@/utils/constants";
import { Chat } from "./chat/chat";
import { useChatStore } from "./chat/lib/chat-store";

export const InnerRightSidebar = ({
   ir_sidebar_state,
   toggle_ir_sidebar,
   initialOpen,
}: {
   ir_sidebar_state: boolean;
   toggle_ir_sidebar: () => void;
   initialOpen?: boolean;
}) => {
   const { setOpen, setOpenMobile, open, openMobile, isMobile } = useSidebar();
   const set_ir_sidebar_state = useSandStateStore((s) => s.set_ir_sidebar_state);

   // Get the current threadId from the chat store
   const threadId = useChatStore((s) => s.threadId);

   // Define handleRailClick as a stable callback with useCallback
   const handleRailClick = useCallback(() => {
      toggle_ir_sidebar();
   }, [toggle_ir_sidebar]);

   React.useEffect(() => {
      if (isMobile) {
         if (ir_sidebar_state !== openMobile) {
            setOpenMobile(ir_sidebar_state);
         }
      } else {
         if (ir_sidebar_state !== open) {
            setOpen(ir_sidebar_state);
         }
      }
      // Update cookie when state changes
      document.cookie = `${INNER_RIGHT_SIDEBAR_COOKIE_NAME}=${ir_sidebar_state}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
   }, [ir_sidebar_state, open, openMobile, isMobile]);

   useEffect(() => {
      const down = (e: KeyboardEvent) => {
         if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            set_ir_sidebar_state(!ir_sidebar_state);
         }
      };

      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
   }, [ir_sidebar_state, set_ir_sidebar_state]);
   return (
      <Sidebar
         side="right"
         className="border-l bg-background h-full overflow-scroll scrollbar-hidden"
         set_ir_sidebar_state={set_ir_sidebar_state}
      >
         <SidebarContent className="scrollbar-hidden h-full p-0">
            <React.Suspense fallback={<Loading />}>
               <Chat threadId={threadId} />
            </React.Suspense>
         </SidebarContent>
         <SidebarRail className="after:w-[1px]" onToggle={handleRailClick} enableDrag sideForDrag="right" maxSidebarWidth={29.5} />
      </Sidebar>
   );
};

function Loading() {
   return (
      <div className="flex flex-col gap-2">
         {Array.from({ length: 20 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <div key={index} className="aspect-video h-12 w-full rounded-lg bg-muted/50" />
         ))}
      </div>
   );
}
