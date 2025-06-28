import { Trash2Icon, Undo2Icon, Loader2 } from "lucide-react";
import { Button } from "@docsurf/ui/components/button";
import DeleteDialog from "@/editor/components/custom/ui/delete-dialog";
import React, { useTransition } from "react";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { useConvexTree } from "@/components/sandbox/left/_tree_components/use-convex-tree";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";

export default function Deleted() {
   // Get user and workspaceId
   const { data: user, isLoading: userLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;

   // Get current document
   const { doc } = useCurrentDocument(user, userLoading);

   // Restore mutation
   const restoreDocument = useMutation(api.documents.restoreDocument);
   const [isPending, startTransition] = useTransition();

   const { isLoading: isTreeLoading } = useConvexTree({
      workspaceId: user?.workspaces?.[0]?.workspace?._id as Id<"workspaces">,
   });
   if (isTreeLoading) return null;
   if (!doc?.isDeleted) return null;

   const handleRestore = async () => {
      if (!workspaceId || !doc?._id) return;
      startTransition(async () => {
         try {
            await restoreDocument({ workspaceId, documentId: doc._id });
         } catch (err) {
            showToast("Failed to restore document", "error");
         }
      });
   };

   return (
      <div className="bg-background/80 text-text-error px-4 py-3 md:py-2">
         <div className="flex gap-2 md:items-center">
            <div className="flex grow gap-3 md:items-center">
               <div className="flex grow flex-col justify-between gap-3 md:flex-row md:items-center">
                  <p className="text-xs font-medium">This document is in the trash. You can restore it or delete it permanently.</p>
                  <div className="flex gap-2 max-md:flex-wrap">
                     <Button size="sm" className="text-xs rounded-sm" variant="outline" onClick={handleRestore} disabled={isPending}>
                        {isPending ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Undo2Icon size={16} className="mr-1" />}
                        Restore Document
                     </Button>
                     <DeleteDialog id={doc._id} redirectTo="/doc">
                        <Button size="sm" className="text-xs rounded-sm" variant="destructive">
                           <Trash2Icon size={16} className="mr-1" />
                           Delete permanently
                        </Button>
                     </DeleteDialog>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
