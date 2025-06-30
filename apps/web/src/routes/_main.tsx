import { SidebarInset, SidebarProvider } from "@docsurf/ui/components/sidebar";
import { InnerRightSidebar } from "@/components/sandbox/right-inner/inner-right-sidebar";
import { LeftSidebar } from "@/components/sandbox/left/LeftSidebar";
import Header from "@/components/sandbox/header";
import { useSandStateStore } from "@/store/sandstate";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { INNER_RIGHT_SIDEBAR_COOKIE_NAME, LEFT_SIDEBAR_COOKIE_NAME, RIGHT_SIDEBAR_COOKIE_NAME } from "@/utils/constants";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { SuggestionOverlayProvider } from "@/editor/components/providers/suggestion-overlay/suggestion-overlay-provider";
import { useOfflineIndicator } from "@/hooks/use-offline-indicator";

export const Route = createFileRoute("/_main")({
   component: MainLayoutComponent,
   beforeLoad: ({ context }) => {
      if (!context.userId) {
         throw redirect({ to: "/auth", statusCode: 302 });
      }
   },
});

function MainLayoutComponent() {
   useOfflineIndicator();
   return (
      <SuggestionOverlayProvider>
         <OnboardingProvider>
            <div className="flex overflow-hidden max-h-dvh">
               {/* sidebar 1 */}
               <WrapperLeftSidebar />
               <SidebarInset className="flex-1 min-w-0 bg-background dark:bg-background flex flex-col">
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
      </SuggestionOverlayProvider>
   );
}

const WrapperLeftSidebar = () => {
   const l_sidebar_state = useSandStateStore((s) => s.l_sidebar_state);
   const toggle_l_sidebar = useSandStateStore((s) => s.toggle_l_sidebar);

   return (
      <SidebarProvider
         name="left-sidebar"
         defaultWidth="15.8rem"
         defaultOpen={l_sidebar_state}
         className="w-fit overflow-hidden max-h-dvh"
      >
         <LeftSidebar l_sidebar_state={l_sidebar_state} toggle_l_sidebar={toggle_l_sidebar} />
      </SidebarProvider>
   );
};

const WrapperInnerRightSidebar = () => {
   const ir_sidebar_state = useSandStateStore((s) => s.ir_sidebar_state);
   const toggle_ir_sidebar = useSandStateStore((s) => s.toggle_ir_sidebar);

   return (
      <SidebarProvider
         defaultWidth="28rem"
         name="inner-right-sidebar"
         defaultOpen={ir_sidebar_state}
         className="w-fit overflow-hidden max-h-dvh min-h-[calc(100svh-95px)]"
      >
         <InnerRightSidebar ir_sidebar_state={ir_sidebar_state} toggle_ir_sidebar={toggle_ir_sidebar} />
      </SidebarProvider>
   );
};
