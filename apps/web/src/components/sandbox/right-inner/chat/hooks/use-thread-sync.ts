import { useChatStore } from "../lib/chat-store";
import { useEffect } from "react";

interface UseThreadSyncProps {
   routeThreadId: string | undefined;
}

export function useThreadSync({ routeThreadId }: UseThreadSyncProps) {
   const { threadId, setThreadId, resetChat, triggerRerender } = useChatStore();

   useEffect(() => {
      if (routeThreadId === undefined) {
         console.log("[thread-sync] resetChat");
         resetChat();
      } else {
         setThreadId(routeThreadId);
         triggerRerender();
      }
   }, [routeThreadId, setThreadId, resetChat, triggerRerender]);

   return { threadId, setThreadId };
}
