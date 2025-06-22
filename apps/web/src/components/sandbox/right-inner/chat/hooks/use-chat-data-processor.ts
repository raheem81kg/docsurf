import { useChatStore } from "../lib/chat-store";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";

interface UseChatDataProcessorProps {
   data: UseChatHelpers["data"];
   messages: UseChatHelpers["messages"];
}

export function useChatDataProcessor({ data, messages }: UseChatDataProcessorProps) {
   const {
      skipNextDataCheck,
      lastProcessedDataIndex,
      setThreadId,
      setShouldUpdateQuery,
      setLastProcessedDataIndex,
      setSkipNextDataCheck,
      setAttachedStreamId,
      threadId,
      setPendingStream,
   } = useChatStore();

   useEffect(() => {
      if (skipNextDataCheck) {
         setSkipNextDataCheck(false);
         return;
      }

      if (!data || data.length === 0 || messages.length < 0) return;

      for (const _item of data?.slice(lastProcessedDataIndex + 1) ?? []) {
         if (!_item) continue;
         const item = _item as { type: string; content: string };

         if (item.type === "thread_id") {
            setThreadId(item.content);
            if (typeof window !== "undefined") {
               window.history.replaceState({}, "", `/thread/${item.content}`);
            }
            setShouldUpdateQuery(true);
            console.log("[CDP:thread_id]", { t: item.content });
         }

         if (item.type === "stream_id") {
            if (threadId) {
               setAttachedStreamId(threadId, item.content);
               setPendingStream(threadId, false);
               console.log("[CDP:stream_id]", {
                  t: threadId,
                  sid: item.content.slice(0, 5),
               });
            }
         }
      }

      setLastProcessedDataIndex((data?.length ?? 0) - 1);
   }, [
      data,
      messages.length,
      skipNextDataCheck,
      lastProcessedDataIndex,
      setThreadId,
      setShouldUpdateQuery,
      setLastProcessedDataIndex,
      setSkipNextDataCheck,
      setAttachedStreamId,
      threadId,
      setPendingStream,
   ]);
}
