import { type ErrorComponentProps, Outlet, useParams } from "@tanstack/react-router";
import { createLazyFileRoute } from "@tanstack/react-router";
import { SharedChat } from "@/components/sandbox/right-inner/chat/shared-chat";

export const ChatErrorBoundary = ({ error, info, reset }: ErrorComponentProps) => {
   const isNotFound = error.message.includes("ArgumentValidationError");

   return (
      <div className="relative flex h-[calc(100dvh-64px)] flex-col items-center justify-center">
         <div className="text-center">
            {isNotFound ? (
               <>
                  <h1 className="mb-4 font-bold text-4xl text-muted-foreground">404</h1>
                  <p className="mb-6 text-lg text-muted-foreground">Thread not found</p>
                  <p className="text-muted-foreground text-sm">The thread you're looking for doesn't exist or has been deleted.</p>
               </>
            ) : (
               <>
                  <h1 className="mb-4 font-bold text-2xl text-muted-foreground">Something went wrong</h1>
                  <p className="text-muted-foreground text-sm">An error occurred while loading this page.</p>
               </>
            )}
         </div>
      </div>
   );
};

export const Route = createLazyFileRoute("/_main/s/$sharedThreadId")({
   component: RouteComponent,
   errorComponent: ChatErrorBoundary,
});

function RouteComponent() {
   const { sharedThreadId } = Route.useParams();
   return <SharedChat sharedThreadId={sharedThreadId} />;
}
