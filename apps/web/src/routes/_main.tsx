import { SidebarInset, SidebarProvider } from "@docsurf/ui/components/sidebar";
import { InnerRightSidebar } from "@/components/sandbox/right-inner/inner-right-sidebar";
import { LeftSidebar } from "@/components/sandbox/left/LeftSidebar";
import Header from "@/components/sandbox/header";
import { useSandStateStore } from "@/store/sandstate";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import SuggestionOverlayRoot from "@/editor/components/providers/suggestion-overlay/suggestion-overlay-root";
import { useOfflineIndicator } from "@/hooks/use-offline-indicator";
import { useSession } from "@/hooks/auth-hooks";
import { useAuthTokenStore } from "@/hooks/use-auth-store";
import { useEffect } from "react";

export const Route = createFileRoute("/_main")({
   ssr: false,
   head: () => ({
      meta: [
         {
            title: "Docsurf - AI Document Editor",
         },
         {
            name: "description",
            content: "Create, edit, and collaborate on documents with AI assistance. Your intelligent document workspace.",
         },
         {
            name: "robots",
            content: "noindex, nofollow", // App pages shouldn't be indexed
         },
      ],
   }),
   component: MainLayoutComponent,
});

function MainLayoutComponent() {
   const { data: session, isPending } = useSession();
   useOfflineIndicator();
   const isUserNotSignedIn = !session?.user && !isPending;

   // Initialize auth token store on app load and session changes
   useEffect(() => {
      if (!isPending) {
         useAuthTokenStore.getState().refetchToken();
      }
   }, [isPending, session?.user?.id]);
   return (
      <OnboardingProvider>
         <div className="flex overflow-hidden max-h-dvh">
            {/* sidebar 1 */}
            <WrapperLeftSidebar />
            <SidebarInset className="flex-1 min-w-0 bg-background dark:bg-background flex flex-col">
               <Header />
               <div className="flex overflow-hidden h-full">
                  <div className="flex-1 min-w-0 scrollbar-hidden">
                     <Outlet />
                     <SuggestionOverlayRoot />
                  </div>
                  {/* sidebar 3 */}
                  {!isUserNotSignedIn && <WrapperInnerRightSidebar />}
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
      <SidebarProvider
         name="left-sidebar"
         defaultWidth="15.8rem"
         defaultOpen={l_sidebar_state}
         className="max-h-dvh w-fit overflow-hidden"
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
         defaultWidth="26rem"
         name="inner-right-sidebar"
         defaultOpen={ir_sidebar_state}
         className="max-h-dvh min-h-[calc(100dvh-95px)] w-fit overflow-hidden"
      >
         <InnerRightSidebar ir_sidebar_state={ir_sidebar_state} toggle_ir_sidebar={toggle_ir_sidebar} />
      </SidebarProvider>
   );
};
