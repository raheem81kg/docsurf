import { createFileRoute } from "@tanstack/react-router";
import { DocumentErrorComponent } from "@/components/document-error";
import { NotFound } from "@/components/not-found";
import MinimalTiptap from "@/editor/components/custom/minimal-tiptap";
import { cn } from "@docsurf/ui/lib/utils";
import * as React from "react";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useConvexTree } from "@/components/sandbox/left/_tree_components/use-convex-tree";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { SignupMessagePrompt } from "@/components/sandbox/right-inner/chat/signup-message-prompt";
import { useSession } from "@/hooks/auth-hooks";
import { Button } from "@docsurf/ui/components/button";
import { FileText, Plus } from "lucide-react";
import { useMutation } from "convex/react";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";

// Beautiful 404 component for documents
function DocumentNotFound() {
   const navigate = useNavigate();
   const [isCreating, setIsCreating] = React.useState(false);

   // Get workspaceId from current user
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const workspaceId = user?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;
   const createDocument = useMutation(api.documents.createDocument);

   const handleCreateDocument = React.useCallback(async () => {
      if (!workspaceId || isCreating) return;

      setIsCreating(true);
      try {
         const doc = await createDocument({
            workspaceId,
            title: DEFAULT_TEXT_TITLE,
            documentType: "text/plain",
            parentId: undefined,
            orderPosition: Date.now(), // Use timestamp for ordering
         });

         showToast("Document created!", "success");
         navigate({ to: "/doc/$documentId", params: { documentId: doc.id } });
      } catch (err) {
         console.error("Failed to create document:", err);
         showToast("Failed to create document. Please try again.", "error");
      } finally {
         setIsCreating(false);
      }
   }, [workspaceId, createDocument, navigate, isCreating]);

   return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-8">
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center max-w-md mx-auto"
         >
            {/* Icon */}
            <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.1, duration: 0.4 }}
               className="mb-8"
            >
               <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-bg-semantic-attention-subtle dark:bg-bg-semantic-attention-subtle rounded-full flex items-center justify-center">
                     <div className="w-12 h-12 bg-bg-semantic-attention-subtle/50 dark:bg-bg-semantic-attention-subtle/50 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-text-emphasis dark:text-text-emphasis" />
                     </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-bg-semantic-attention-subtle dark:bg-bg-semantic-attention-subtle rounded-full flex items-center justify-center border-2 border-background">
                     <span className="text-text-emphasis dark:text-text-emphasis text-sm font-bold">!</span>
                  </div>
               </div>
            </motion.div>

            {/* Main message */}
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2, duration: 0.4 }}
               className="mb-6"
            >
               <h1 className="text-2xl font-semibold text-foreground mb-3">We couldn't find that document</h1>
               <p className="text-muted-foreground leading-relaxed">Please check the URL. Alternatively, create a new document.</p>
            </motion.div>

            {/* Action button */}
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3, duration: 0.4 }}
               className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
               <Button
                  onClick={handleCreateDocument}
                  disabled={isCreating || !workspaceId}
                  className="flex items-center gap-2"
                  size="lg"
               >
                  {isCreating ? (
                     <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Creating...
                     </>
                  ) : (
                     <>
                        <Plus className="w-4 h-4" />
                        New Document
                     </>
                  )}
               </Button>

               <Button variant="ghost" onClick={() => navigate({ to: "/doc" })} size="lg">
                  Go to Library
               </Button>
            </motion.div>

            {/* Subtle decoration */}
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5, duration: 0.6 }}
               className="mt-12 pt-8 border-t border-border"
            >
               <p className="text-xs text-muted-foreground">Document ID: {window.location.pathname.split("/").pop()}</p>
            </motion.div>
         </motion.div>
      </div>
   );
}

export const Route = createFileRoute("/_main/doc/$documentId")({
   errorComponent: DocumentErrorComponent,
   component: DocumentComponent,
   notFoundComponent: () => {
      return <NotFound>Document not found</NotFound>;
   },
});

function DocumentComponent() {
   const { data: session, isPending } = useSession();
   const { data: user, isLoading: isUserLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc, docLoading: isDocLoading } = useCurrentDocument(user);
   const { isLoading: isTreeLoading } = useConvexTree({
      workspaceId: user?.workspaces?.[0]?.workspace?._id as Id<"workspaces">,
   });

   const isMobile = useIsMobile();

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
      return {};
   }, [doc?.content]);

   // Show loading only when we're actually loading something
   if (isUserLoading || (user && isTreeLoading) || (user && isDocLoading) || isPending) {
      return <AnimatedLoadingBar />;
   }

   // Same authentication pattern as chat.tsx
   if (!session?.user && !isPending) {
      return (
         <div className="relative flex h-[calc(100dvh-64px)] items-center justify-center">
            <SignupMessagePrompt />
         </div>
      );
   }

   // If we have a user but no document and we're not loading, show beautiful 404
   if (user && !doc && !isDocLoading) {
      return <DocumentNotFound />;
   }

   // Only allow text/plain documents in the editor
   if (doc && doc?.documentType !== "text/plain") {
      return (
         <div className="grid h-full place-content-center">
            <p className="text-muted-foreground text-sm">{doc.documentType} is not supported for editing.</p>
         </div>
      );
   }

   // Only render the editor if we actually have a document
   if (!doc) {
      return null;
   }

   return (
      // <div className="h-full">
      <div className="relative h-full">
         <MinimalTiptap
            isMainEditor={true}
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
            placeholder={
               isMobile
                  ? `Start writing..., or type "++" to get an AI suggestion`
                  : "Start writing, or press Ctrl+Space for AI autocomplete..."
            }
            editable={!isUserLoading && !!user}
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
