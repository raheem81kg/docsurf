import { createLazyFileRoute } from "@tanstack/react-router";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { Button } from "@docsurf/ui/components/button";
import { FileText, ExternalLink, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/hooks/auth-hooks";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { Analytics } from "@/components/providers/posthog";
import throttle from "lodash/throttle";
import { Suspense, useMemo, useEffect } from "react";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { MinimalTiptapReadonly } from "@/editor/components/custom/minimal-tiptap-readonly";
import { api as convexApi } from "@docsurf/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import React from "react";

export const Route = createLazyFileRoute("/_p/p/$documentId")({
   component: PublicDocumentComponent,
});

// Lazy-load the read-only editor for faster initial load

function PublicDocumentComponent() {
   const { documentId } = Route.useParams();
   const { data: session } = useSession();
   const navigate = useNavigate();

   // Cache public document for 5 minutes to avoid refetching
   const { data: doc, isLoading } = useQuery({
      ...convexQuery(api.documents.fetchPublicDocument, { documentId: documentId as Id<"documents"> }),
      enabled: !!documentId,
      staleTime: 5 * 60 * 1000, // 5 minutes
   });

   // Throttle Analytics.track to fire at most once every 10 seconds
   const throttledTrack = throttle(
      (docId: string, userId?: string, userEmail?: string) => {
         Analytics.track("document_viewed", {
            documentId: docId,
            userId,
            userEmail,
         });
      },
      5000, // 5 seconds
      { trailing: false }
   );

   // Memoize content parsing for performance
   const content = useMemo(() => {
      if (!doc) return {};
      if (typeof doc.content === "string") {
         try {
            return JSON.parse(doc.content);
         } catch {
            return {};
         }
      }
      return doc.content || {};
   }, [doc]);

   // Fire analytics after render
   useEffect(() => {
      if (doc && !import.meta.env.DEV) {
         throttledTrack(doc._id, session?.user?.id, session?.user?.email);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [doc, session?.user?.id, session?.user?.email]);

   // Add AnimatedLoadingBar (copied from doc.$documentId.tsx)
   const AnimatedLoadingBar: React.FC = () => (
      <div
         className="pointer-events-none absolute top-0 left-0 z-50 h-[2px] w-full overflow-hidden"
         style={{ background: "transparent" }}
      >
         <div className="absolute top-[0px] h-full w-40 animate-slide-effect bg-gradient-to-r from-gray-200 via-80% via-black to-gray-200 dark:from-gray-800 dark:via-80% dark:via-white dark:to-gray-800" />
      </div>
   );

   if (isLoading) {
      return (
         <div className="flex flex-col justify-between h-full min-h-screen relative">
            <AnimatedLoadingBar />
            <Skeleton className="h-[40px] bg-accent/40 w-full" />
            <div className="bg-accent/10 flex-1 w-full flex items-center justify-center relative">
               <div className="text-center max-w-sm mx-auto px-6">
                  <div className="mb-4">
                     <div className="w-8 h-8 mx-auto mb-3 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                  </div>
                  <p className="text-base font-medium text-foreground mb-2">Loading public document…</p>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch the content.</p>
               </div>
            </div>
            <Skeleton className="h-[40px] w-full bg-accent/40" />
         </div>
      );
   }

   if (!doc) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Document Not Found</h1>
            <p className="text-muted-foreground mb-6">This document doesn't exist or is not public.</p>
            <Button onClick={() => navigate({ to: "/" })}>Go to Docsurf</Button>
         </div>
      );
   }

   // Add a bottom toolbar placeholder for shared doc page, matching MinimalTiptap
   const SharedDocBottomToolbar = () => {
      const isMobile = useIsMobile();
      return (
         <div
            className="z-10 sticky bottom-0 bg-background border-t border-border min-h-[40px] flex items-center justify-end"
            style={isMobile ? { paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
         />
      );
   };

   // Add a bottom toolbar for public docs with fork feature
   const ForkPublicDocToolbar = () => {
      const { data: session } = useSession();
      const navigate = useNavigate();
      const forkDocument = useMutation(convexApi.documents.forkPublicDocument);
      const [isForking, setIsForking] = React.useState(false);

      const handleFork = async () => {
         if (!session?.user?.id) {
            navigate({ to: "/auth" });
            return;
         }
         setIsForking(true);
         try {
            const result = await forkDocument({ documentId: doc._id });
            if (result && result.id) {
               navigate({ to: "/doc/$documentId", params: { documentId: result.id as string } });
            } else {
               // TODO: Show error toast
               setIsForking(false);
            }
         } catch (err) {
            // TODO: Show error toast
            setIsForking(false);
         }
      };

      return (
         <div className="z-10 sticky bottom-0 bg-background border-t border-border min-h-[40px] flex items-center justify-end px-4 py-2">
            <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
               <div>
                  <h3 className="font-semibold text-sm mb-1">This is a shared document.</h3>
                  <p className="text-muted-foreground text-sm">Fork it to your account to make your own copy and start editing.</p>
               </div>
               <Button onClick={handleFork} className="ml-0 sm:ml-4" disabled={isForking}>
                  {isForking ? (
                     <span className="flex items-center">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Forking…
                     </span>
                  ) : (
                     <span className="flex items-center">
                        Fork Document
                        <ArrowRight className="ml-2 h-4 w-4" />
                     </span>
                  )}
               </Button>
            </div>
         </div>
      );
   };

   return (
      <div className="relative h-full flex flex-col min-h-0 bg-background">
         <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 min-h-0 flex flex-col h-full">
               <Suspense fallback={<Skeleton className="mb-4 h-8 w-full animate-pulse" />}>
                  <MinimalTiptapReadonly
                     value={content}
                     editorContentClassName=""
                     className="flex-1 min-h-0 flex flex-col h-full"
                     editorClassName="focus:outline-none md:px-14 px-4 pb-8 pt-6 min-h-full"
                  />
               </Suspense>
            </div>
            {/* Show fork toolbar if public */}
            {doc.isPublic ? <ForkPublicDocToolbar /> : <SharedDocBottomToolbar />}
         </div>
      </div>
   );
}
