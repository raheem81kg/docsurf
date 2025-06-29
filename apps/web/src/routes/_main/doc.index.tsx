import { createFileRoute, redirect } from "@tanstack/react-router";
import { api } from "@docsurf/backend/convex/_generated/api";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import { ConvexHttpClient } from "convex/browser";
import { env } from "@/env";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import type { CurrentUser } from "@docsurf/backend/convex/auth";
import type { Doc } from "@docsurf/backend/convex/_generated/dataModel";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

export const Route = createFileRoute("/_main/doc/")({
   beforeLoad: async (ctx) => {
      const client = new ConvexHttpClient(env.VITE_CONVEX_URL);
      if (ctx.context.token) {
         client.setAuth(ctx.context.token);
      }

      // 1. Get user and workspace
      let user: CurrentUser | undefined;
      let workspaceId: string | undefined;
      try {
         user = await client.query(api.auth.getCurrentUser, {});
         workspaceId = user?.workspaces?.[0]?.workspace?._id;
      } catch (err) {
         logError("Error fetching user/workspace:", err);
         throw redirect({ to: "/", statusCode: 302 });
      }

      // 2. Create workspace if needed
      if (!workspaceId && user?._id) {
         try {
            await client.mutation(api.workspaces.createWorkspace, {});
            user = await client.query(api.auth.getCurrentUser, {});
            workspaceId = user?.workspaces?.[0]?.workspace?._id;
         } catch (err) {
            logError("Error creating workspace:", err);
            throw redirect({ to: "/", statusCode: 302 });
         }
      }

      if (!workspaceId) throw redirect({ to: "/", statusCode: 302 });

      // 3. Fetch document tree
      let docs: Doc<"documents">[] = [];
      try {
         const docsResult = await client.query(api.documents.fetchDocumentTree, {
            workspaceId: workspaceId as Id<"workspaces">,
            limit: 1,
            documentType: "text/plain",
         });
         docs = docsResult?.data ?? [];
      } catch (err) {
         logError("Error fetching document tree:", err);
         throw redirect({ to: "/", statusCode: 302 });
      }

      // 4. Redirect to first document if exists
      if (docs.length > 0) {
         throw redirect({ to: "/doc/$documentId", params: { documentId: docs[0]._id } });
      }

      // 5. Create a new document if none exist
      let newDocId: string | undefined;
      try {
         const newDoc = await client.mutation(api.documents.createDocument, {
            workspaceId: workspaceId as Id<"workspaces">,
            title: DEFAULT_TEXT_TITLE,
            documentType: "text/plain",
            orderPosition: 0,
         });
         newDocId = newDoc.id;
      } catch (err) {
         logError("Error creating document:", err);
         throw redirect({ to: "/", statusCode: 302, search: { error: "doc-setup" } });
      }
      if (newDocId) {
         throw redirect({ to: "/doc/$documentId", params: { documentId: newDocId } });
      }
      throw redirect({ to: "/", statusCode: 302 });
   },
   component: RouteComponent,
});

// Helper for dev logging
function logError(message: string, err: unknown) {
   if (import.meta.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(message, err);
   }
}

function RouteComponent() {
   // Show a loading skeleton placeholder
   const [showMessage, setShowMessage] = useState(false);
   useEffect(() => {
      const timeout = setTimeout(() => setShowMessage(true), 3000);
      return () => clearTimeout(timeout);
   }, []);

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
