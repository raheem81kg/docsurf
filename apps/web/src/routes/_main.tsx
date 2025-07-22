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
import { useSuggestionOverlayStore } from "@/store/use-suggestion-overlay-store";
import { useEditorRefStore } from "@/store/use-editor-ref-store";
import { RightSidebar } from "@/components/sandbox/right/right-sidebar";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";

export const Route = createFileRoute("/_main")({
   ssr: false,
   head: () => ({
      meta: [
         {
            title: "DocSurf - AI Document Editor | Smart Writing Workspace",
         },
         {
            name: "description",
            content:
               "Create, edit, and collaborate on documents with AI assistance. Features smart autocomplete, intelligent text suggestions, AI chat, and seamless document management.",
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
   const isMobile = useIsMobile();

   // Initialize auth token store on app load and session changes
   useEffect(() => {
      if (!isPending) {
         useAuthTokenStore.getState().refetchToken();
      }
   }, [isPending, session?.user?.id]);

   // Add global Cmd/Ctrl+J shortcut for suggestion overlay
   const tryOpenSuggestionOverlayFromEditorSelection = useSuggestionOverlayStore((s) => s.tryOpenSuggestionOverlayFromEditorSelection);
   const closeSuggestionOverlay = useSuggestionOverlayStore((s) => s.closeSuggestionOverlay);
   const isOpen = useSuggestionOverlayStore((s) => s.isOpen);
   const editor = useEditorRefStore((s) => s.editor);
   useEffect(() => {
      const handleCommandJ = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
            e.preventDefault();
            if (isOpen) {
               closeSuggestionOverlay();
            } else if (editor) {
               tryOpenSuggestionOverlayFromEditorSelection(editor);
            }
         }
      };
      window.addEventListener("keydown", handleCommandJ);
      return () => window.removeEventListener("keydown", handleCommandJ);
   }, [tryOpenSuggestionOverlayFromEditorSelection, closeSuggestionOverlay, isOpen, editor]);
   return (
      <OnboardingProvider>
         <div className="flex max-h-dvh w-full overflow-hidden">
            {/* sidebar 1 */}
            <WrapperLeftSidebar />

            {/* On mobile: render right sidebar before SidebarInset to fix overflow */}
            {isMobile && <WrapperInnerRightSidebar />}

            <SidebarInset className="flex min-w-0 flex-1 flex-col bg-background">
               <Header />
               <div className="flex h-full overflow-hidden">
                  <div className="scrollbar-hidden min-w-0 flex-1">
                     <Outlet />
                     <SuggestionOverlayRoot />
                  </div>
               </div>
            </SidebarInset>

            {/* On desktop: render right sidebar after SidebarInset for proper positioning */}
            {!isMobile && <WrapperInnerRightSidebar />}
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
         className="max-h-dvh w-fit overflow-hidden"
      >
         <InnerRightSidebar ir_sidebar_state={ir_sidebar_state} toggle_ir_sidebar={toggle_ir_sidebar} />
      </SidebarProvider>
   );
};
// const WrapperRightSidebar = ({ initialOpen }: { initialOpen?: boolean }) => {
//    const r_sidebar_state = useSandStateStore((s) => s.r_sidebar_state);
//    const toggle_r_sidebar = useSandStateStore((s) => s.toggle_r_sidebar);

//    return (
//       <SidebarProvider
//          defaultWidth="24rem"
//          name="right-sidebar"
//          defaultOpen={initialOpen ?? false}
//          className="w-fit overflow-hidden max-h-dvh"
//       >
//          <RightSidebar r_sidebar_state={r_sidebar_state} toggle_r_sidebar={toggle_r_sidebar} />
//       </SidebarProvider>
//    );
// };
