import { api } from "@docsurf/backend/convex/_generated/api";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { useQuery as useConvexQuery } from "convex/react";
import { useEffect } from "react";

interface UseDynamicTitleProps {
   threadId: string | undefined;
}

export function useDynamicTitle({ threadId }: UseDynamicTitleProps) {
   const thread = useConvexQuery(api.threads.getThread, threadId ? { threadId: threadId as Id<"threads"> } : "skip");

   useEffect(() => {
      if (threadId && thread && !("error" in thread)) {
         document.title = `${thread.title} - Docsurf`;
      } else {
         document.title = "Docsurf";
      }
   }, [threadId, thread]);
}
