import { createFileRoute } from "@tanstack/react-router";
import { api } from "@docsurf/backend/convex/_generated/api";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";

export const Route = createFileRoute("/_main/doc/")({
   component: RouteComponent,
});

function RouteComponent() {
   const [showMessage, setShowMessage] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const navigate = useNavigate();

   // Convex hooks
   const user = useQuery(api.auth.getCurrentUser, {});
   const createWorkspace = useMutation(api.workspaces.createWorkspace);
   const createDocument = useMutation(api.documents.createDocument);

   // Get workspaceId from user
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;

   // Fetch docs only if workspaceId is available
   const docsResult = useQuery(
      api.documents.fetchDocumentTree,
      workspaceId
         ? {
              workspaceId,
              limit: 1,
              documentType: "text/plain",
           }
         : "skip"
   );

   // Throttle creation to prevent double-creation
   const creatingRef = useRef(false);

   useEffect(() => {
      // Only run when user and docsResult are loaded
      if (user === undefined || docsResult === undefined) return;
      if (!user) {
         setError("User not found. Please sign in again.");
         return;
      }
      let cancelled = false;
      const handle = async () => {
         setError(null);
         let wsId = workspaceId;
         try {
            // Throttle: only allow one creation at a time
            if (creatingRef.current) return;
            // Create workspace if needed
            if (!wsId && user._id) {
               creatingRef.current = true;
               await createWorkspace({});
               creatingRef.current = false;
               // Wait for user to refetch (Convex will re-render)
               return;
            }
            wsId = wsId || user.workspaces?.[0]?.workspace?._id;
            if (!wsId) {
               setError("No workspace found or created.");
               return;
            }
            // If docs exist, redirect
            if (docsResult?.data && docsResult.data.length > 0) {
               navigate({ to: "/doc/$documentId", params: { documentId: docsResult.data[0]._id } });
               return;
            }
            // If no docs, create one
            creatingRef.current = true;
            const newDoc = await createDocument({
               workspaceId: wsId,
               title: DEFAULT_TEXT_TITLE,
               documentType: "text/plain",
               orderPosition: 0,
            });
            creatingRef.current = false;
            if (!cancelled && newDoc?.id) {
               navigate({ to: "/doc/$documentId", params: { documentId: newDoc.id } });
            }
         } catch (err) {
            creatingRef.current = false;
            setError("Error setting up workspace or document.");
         }
      };
      handle();
      return () => {
         cancelled = true;
      };
   }, [user, docsResult, createWorkspace, createDocument, navigate, workspaceId]);

   useEffect(() => {
      const timeout = setTimeout(() => setShowMessage(true), 3000);
      return () => clearTimeout(timeout);
   }, []);

   if (user === undefined || docsResult === undefined) {
      // Still loading
      return (
         <div className="flex flex-col justify-between h-full">
            <Skeleton className="h-[40px] bg-accent/40 w-full" />
            <div className="bg-accent/10 flex-1 w-full flex items-center justify-center relative">
               {showMessage && (
                  <motion.div
                     initial={{ opacity: 0, y: 16 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     className="absolute left-1/2 top-1/2 italic -translate-x-1/2 -translate-y-1/2 text-lg text-muted-foreground text-center pointer-events-none select-none"
                  >
                     Click a document in the tree to view.
                  </motion.div>
               )}
            </div>
            <Skeleton className="h-[40px] w-full bg-accent/40" />
         </div>
      );
   }
   if (error) {
      return (
         <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500">{error}</p>
         </div>
      );
   }
   return null;
}
