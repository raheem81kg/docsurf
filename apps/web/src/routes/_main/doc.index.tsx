import { createFileRoute } from "@tanstack/react-router";
import { api } from "@docsurf/backend/convex/_generated/api";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useSession } from "@/hooks/auth-hooks";
import { SignupMessagePrompt } from "@/components/sandbox/right-inner/chat/signup-message-prompt";
import { useConvexQuery } from "@convex-dev/react-query";
import { buildTree, flattenTree } from "@/components/sandbox/left/_tree_components/components/utilities";

export const Route = createFileRoute("/_main/doc/")({
   component: RouteComponent,
});

function RouteComponent() {
   const [showMessage, setShowMessage] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const navigate = useNavigate();

   // Session hook (same as chat.tsx)
   const { data: session, isPending } = useSession();

   // Convex hooks
   const user = useConvexQuery(api.auth.getCurrentUser, session?.user?.id ? {} : "skip");
   const createWorkspace = useMutation(api.workspaces.createWorkspace);
   const createDocument = useMutation(api.documents.createDocument);

   // Get workspaceId from user
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;

   // Fetch all documents to find the first text document in tree order
   const docsResult = useConvexQuery(
      api.documents.fetchDocumentTree,
      workspaceId && user?._id
         ? {
              workspaceId,
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
            // If docs exist, find the first text document using existing tree utilities
            if (docsResult?.data && docsResult.data.length > 0) {
               const allDocs = docsResult.data;

               // Use existing tree utilities to get proper tree order
               const treeItems = buildTree(
                  allDocs.map((doc, idx) => ({
                     id: doc._id,
                     parentId: doc.parentId ?? null,
                     depth: doc.depth,
                     children: [],
                     documentType: doc.documentType,
                     title: doc.title || DEFAULT_TEXT_TITLE,
                     orderPosition: doc.orderPosition,
                     updatedAt: doc.updatedAt ?? doc._creationTime,
                     index: idx,
                  }))
               );

               // Flatten the tree to get items in proper traversal order
               const flattenedItems = flattenTree(treeItems);

               // Find the first text document in the flattened (properly ordered) list
               const firstTextDoc = flattenedItems.find((item) => item.documentType === "text/plain");
               if (firstTextDoc) {
                  navigate({ to: "/doc/$documentId", params: { documentId: firstTextDoc.id as string } });
                  return;
               }

               // Fallback: if no text documents exist, go to first document overall
               if (flattenedItems.length > 0) {
                  navigate({ to: "/doc/$documentId", params: { documentId: flattenedItems[0].id as string } });
                  return;
               }
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
      const timeout = setTimeout(() => setShowMessage(true), 2500);
      return () => clearTimeout(timeout);
   }, []);

   // Same authentication pattern as chat.tsx
   if (!session?.user && !isPending) {
      return (
         <div className="relative flex h-[calc(100dvh-64px)] items-center justify-center">
            <SignupMessagePrompt />
         </div>
      );
   }

   if (user === undefined || docsResult === undefined) {
      // Still loading
      return (
         <div className="flex flex-col justify-between h-full">
            <Skeleton className="h-[40px] bg-accent/40 w-full" />
            <div className="bg-accent/10 flex-1 w-full flex items-center justify-center relative">
               {showMessage && (
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, ease: "easeOut" }}
                     className="text-center max-w-sm mx-auto px-6"
                  >
                     <div className="mb-4">
                        <div className="w-8 h-8 mx-auto mb-3 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                     </div>
                     <p className="text-base font-medium text-foreground mb-2">Setting up your workspace</p>
                     <p className="text-sm text-muted-foreground">Redirecting to your document...</p>
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
