import { SidebarInset, SidebarProvider } from "@docsurf/ui/components/sidebar";
import { InnerRightSidebar } from "@/components/sandbox/right-inner/inner-right-sidebar";
import { LeftSidebar } from "@/components/sandbox/left/LeftSidebar";
import Header from "@/components/sandbox/header";
import React, { useEffect } from "react";
import { OnboardingWrapper } from "@/components/onboarding";
import { useSandStateStore } from "@/store/sandstate";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { INNER_RIGHT_SIDEBAR_COOKIE_NAME, LEFT_SIDEBAR_COOKIE_NAME, RIGHT_SIDEBAR_COOKIE_NAME } from "@/utils/constants";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";

export const Route = createFileRoute("/_main")({
   component: MainLayoutComponent,
});

function MainLayoutComponent() {
   const initializeState = useSandStateStore((s) => s.initializeState);

   // No need to read cookies or set initialOpen here

   // Optionally, you can remove the initializeState effect if not needed

   return (
      <OnboardingProvider>
         <div className="flex overflow-hidden max-h-dvh">
            {/* sidebar 1 */}
            <WrapperLeftSidebar />
            <OnboardingWrapper />
            <SidebarInset className="flex-1 min-w-0 bg-default dark:bg-default flex flex-col">
               <Header />

               <div className="flex overflow-hidden h-full">
                  <div className="flex-1 min-w-0 overflow-auto scrollbar-hidden">
                     <Outlet />
                  </div>

                  {/* sidebar 3 */}
                  <WrapperInnerRightSidebar />
               </div>
            </SidebarInset>
         </div>
      </OnboardingProvider>
   );
}

const WrapperLeftSidebar = () => {
   const l_sidebar_state = useSandStateStore((s) => s.l_sidebar_state);
   const toggle_l_sidebar = useSandStateStore((s) => s.toggle_l_sidebar);

   return (
      <SidebarProvider name="left-sidebar" defaultWidth="15.8rem" className="w-fit overflow-hidden max-h-dvh">
         <LeftSidebar l_sidebar_state={l_sidebar_state} toggle_l_sidebar={toggle_l_sidebar} />
      </SidebarProvider>
   );
};

const WrapperInnerRightSidebar = () => {
   const ir_sidebar_state = useSandStateStore((s) => s.ir_sidebar_state);
   const toggle_ir_sidebar = useSandStateStore((s) => s.toggle_ir_sidebar);

   return (
      <SidebarProvider
         defaultWidth="23.5rem"
         name="inner-right-sidebar"
         className="w-fit overflow-hidden max-h-dvh min-h-[calc(100svh-95px)]"
      >
         <InnerRightSidebar ir_sidebar_state={ir_sidebar_state} toggle_ir_sidebar={toggle_ir_sidebar} />
      </SidebarProvider>
   );
};
