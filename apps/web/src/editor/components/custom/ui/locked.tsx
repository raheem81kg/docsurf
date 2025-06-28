import { LockIcon } from "lucide-react";
import React from "react";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useConvexTree } from "@/components/sandbox/left/_tree_components/use-convex-tree";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
export default function Locked() {
   // Get user and workspaceId
   const { data: user, isLoading: userLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { doc } = useCurrentDocument(user, userLoading);
   const { isLoading: isTreeLoading } = useConvexTree({
      workspaceId: user?.workspaces?.[0]?.workspace?._id as Id<"workspaces">,
   });
   if (isTreeLoading) return null;
   if (!doc?.isLocked) return null;

   return (
      <div className="sticky top-0 z-30 w-full bg-background/80 border-b border-secondary backdrop-blur">
         <p className="flex items-center font-medium justify-center gap-x-2 p-2 text-xs text-muted-foreground">
            <LockIcon size={14} />
            Page is locked
         </p>
      </div>
   );
}
