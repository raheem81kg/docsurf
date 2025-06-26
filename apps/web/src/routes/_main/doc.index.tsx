import { createFileRoute, redirect } from "@tanstack/react-router";
import { api } from "@docsurf/backend/convex/_generated/api";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import { ConvexHttpClient } from "convex/browser";
import { env } from "@/env";

export const Route = createFileRoute("/_main/doc/")({
   beforeLoad: async (ctx) => {
      try {
         // 1. Setup Convex HTTP client with auth
         const client = new ConvexHttpClient(env.VITE_CONVEX_URL);
         if (ctx.context.token) {
            client.setAuth(ctx.context.token);
         }

         // 1. Get current user and workspaceId
         let user = await client.query(api.auth.getCurrentUser, {});
         let workspaceId = user?.workspaces?.[0]?.workspace?._id;

         // 2. If no workspace, create one and refetch user
         if (!workspaceId && user?._id) {
            await client.mutation(api.workspaces.createWorkspace, {});
            user = await client.query(api.auth.getCurrentUser, {});
            workspaceId = user?.workspaces?.[0]?.workspace?._id;
         }

         if (!workspaceId) throw redirect({ to: "/auth", statusCode: 302 });

         // 3. Fetch document tree
         const docsResult = await client.query(api.documents.fetchDocumentTree, { workspaceId });
         const docs = docsResult?.data ?? [];

         // 4. Redirect to first doc if exists
         if (docs.length > 0) {
            throw redirect({ to: "/doc/$documentId", params: { documentId: docs[0]._id } });
         }

         // 5. Otherwise, create a new doc and redirect
         const newDoc = await client.mutation(api.documents.createDocument, {
            workspaceId,
            title: DEFAULT_TEXT_TITLE,
            documentType: "text/plain",
            orderPosition: 0,
         });
         throw redirect({ to: "/doc/$documentId", params: { documentId: newDoc.id } });
      } catch (err) {
         if (import.meta.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.error("Error in /doc beforeLoad:", err);
         }
         throw redirect({ to: "/auth", statusCode: 302, search: { error: "doc-setup" } });
      }
   },
   component: RouteComponent,
});

function RouteComponent() {
   return <div>Hello "/doc"!</div>;
}
