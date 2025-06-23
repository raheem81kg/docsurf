import { useChatStore } from "../lib/chat-store";
import { useEffect } from "react";

interface UseThreadSyncProps {
   routeThreadId: string | undefined;
}

export function useThreadSync({ routeThreadId }: UseThreadSyncProps) {
   const { threadId, setThreadId, resetChat, triggerRerender, resetForThread } = useChatStore();

   useEffect(() => {
      if (routeThreadId === undefined) {
         console.log("[thread-sync] resetChat");
         resetChat();
      } else {
         // Reset all chat state for the new thread (prevents carryover bugs)
         resetForThread(routeThreadId);
         triggerRerender();
      }
   }, [routeThreadId, resetForThread, resetChat, triggerRerender]);

   return { threadId, setThreadId };
}
