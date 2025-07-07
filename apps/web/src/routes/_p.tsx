import { SidebarInset } from "@docsurf/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useOfflineIndicator } from "@/hooks/use-offline-indicator";
import { useSession } from "@/hooks/auth-hooks";
import SharedDocHeader from "@/components/sandbox/shared-doc-header";

export const Route = createFileRoute("/_p")({
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
   return (
      <div className="flex overflow-hidden max-h-dvh">
         {/* sidebar 1 */}
         {/* <WrapperLeftSidebar /> */}
         <SidebarInset className="flex-1 min-w-0 bg-background dark:bg-background flex flex-col">
            <SharedDocHeader />

            <div className="flex overflow-hidden h-full">
               <div className="flex-1 min-w-0 overflow-auto scrollbar-hidden">
                  <Outlet />
               </div>

               {/* sidebar 3 */}
               {/* {!isUserNotSignedIn && <WrapperInnerRightSidebar />} */}
            </div>
         </SidebarInset>
      </div>
   );
}
