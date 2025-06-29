import { createFileRoute } from "@tanstack/react-router";
import { DocumentErrorComponent } from "@/components/document-error";
import { NotFound } from "@/components/not-found";
import MinimalTiptap from "@/editor/components/custom/minimal-tiptap";
import { cn } from "@docsurf/ui/lib/utils";
import * as React from "react";
import content from "@/editor/data/content.json";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useConvexTree } from "@/components/sandbox/left/_tree_components/use-convex-tree";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";

export const Route = createFileRoute("/_main/doc/$documentId")({
   errorComponent: DocumentErrorComponent,
   component: DocumentComponent,
   notFoundComponent: () => {
      return <NotFound>Document not found</NotFound>;
   },
});

function DocumentComponent() {
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc, docLoading: isDocLoading } = useCurrentDocument(user);
   const { isLoading: isTreeLoading } = useConvexTree({
      workspaceId: user?.workspaces?.[0]?.workspace?._id as Id<"workspaces">,
   });

   // // Memoize the editor value for performance
   const editorValue = React.useMemo(() => {
      if (typeof doc?.content === "string" && doc.content.length > 0) {
         try {
            return JSON.parse(doc.content);
         } catch (e) {
            return {};
         }
      }
      if (doc?.content && typeof doc.content === "object" && Object.keys(doc.content).length > 0) {
         return doc.content;
      }
      if (doc?.content == null) {
         return content;
      }
      return {};
   }, [doc?.content]);

   if (isTreeLoading || isDocLoading) {
      return <AnimatedLoadingBar />;
   }

   // Only allow text/plain documents in the editor
   if (doc && doc?.documentType !== "text/plain") {
      return (
         <div className="grid h-full place-content-center">
            <p className="text-muted-foreground text-sm">{doc.documentType} is not supported for editing.</p>
         </div>
      );
   }
   return (
      // <div className="h-full">
      <div className="relative h-full">
         <MinimalTiptap
            value={editorValue}
            debounceDelay={2000}
            className={cn("")}
            editorContentClassName=""
            enableVersionTracking={true}
            registerInStore={true}
            output="json"
            onChange={(value) => {
               console.log("[Tiptap Editor] onChange", value);
            }}
            placeholder="Press Ctrl+SPACE for autocomplete..."
            editable={true}
            editorClassName="focus:outline-none px-8 py-4 min-h-full"
         />
      </div>
      // </div>
   );
}

const AnimatedLoadingBar: React.FC = () => (
   <div
      className="pointer-events-none absolute top-0 left-0 z-50 h-[2px] w-full overflow-hidden"
      style={{ background: "transparent" }}
   >
      <div className="absolute top-[0px] h-full w-40 animate-slide-effect bg-gradient-to-r from-gray-200 via-80% via-black to-gray-200 dark:from-gray-800 dark:via-80% dark:via-white dark:to-gray-800" />
   </div>
);
