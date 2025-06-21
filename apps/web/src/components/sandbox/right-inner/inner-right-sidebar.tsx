import { Sidebar, SidebarContent, SidebarRail, useSidebar } from "@docsurf/ui/components/sidebar";
import { useSandStateStore } from "@/store/sandstate";
import { useCallback } from "react";
import React from "react";
import { useCookies } from "react-cookie";
import { INNER_RIGHT_SIDEBAR_COOKIE_NAME, SIDEBAR_COOKIE_MAX_AGE } from "@/utils/constants";

export const InnerRightSidebar = ({
   ir_sidebar_state,
   toggle_ir_sidebar,
}: {
   ir_sidebar_state: boolean;
   toggle_ir_sidebar: () => void;
}) => {
   const { setOpen, setOpenMobile, open, openMobile, isMobile } = useSidebar();
   const [cookies, setCookie] = useCookies([INNER_RIGHT_SIDEBAR_COOKIE_NAME]);
   const set_ir_sidebar_state = useSandStateStore((s) => s.set_ir_sidebar_state);

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
      setCookie(INNER_RIGHT_SIDEBAR_COOKIE_NAME, ir_sidebar_state.toString(), { path: "/", maxAge: SIDEBAR_COOKIE_MAX_AGE });
   }, [ir_sidebar_state, open, openMobile, isMobile]);

   return (
      <Sidebar
         side="right"
         className="border-l bg-default h-full overflow-scroll scrollbar-hidden"
         set_ir_sidebar_state={set_ir_sidebar_state}
      >
         <SidebarContent className="scrollbar-hidden p-0">
            <React.Suspense fallback={<Loading />}>{/* <Chat initialMessages={[]} hasActiveSubscription={true} /> */}</React.Suspense>
         </SidebarContent>
         <SidebarRail onToggle={handleRailClick} enableDrag sideForDrag="right" maxSidebarWidth={28} />
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
