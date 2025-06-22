"use client";

import type { Thread } from "@docsurf/backend/convex/schema/thread";
import { useChatStore } from "../lib/chat-store";
import type { Infer } from "convex/values";
import { useEffect } from "react";

export interface AutoResumeProps {
   autoResume: boolean;
   thread?: Infer<typeof Thread>;
   threadId?: string;
   experimental_resume: () => void;
   status?: "idle" | "streaming" | "submitted" | string;
   threadMessages?: any;
}

export function useAutoResume({ autoResume, thread, threadId, experimental_resume, status, threadMessages }: AutoResumeProps) {
   const attachedStreamId = useChatStore((s) => (threadId ? s.attachedStreamIds[threadId] : undefined));
   const setAttachedStreamId = useChatStore((s) => s.setAttachedStreamId);
   const pending = useChatStore((s) => (threadId ? s.pendingStreams[threadId] : false));

   useEffect(() => {
      // // Debug: log state each time effect runs (concise)
      // console.log("[AR:evaluate]", {
      //     t: threadId,
      //     live: !!thread?.isLive,
      //     cur: thread?.currentStreamId?.slice(0, 5),
      //     att: attachedStreamId?.slice(0, 5),
      //     pending,
      //     msgsLoaded:
      //         threadMessages && !("error" in threadMessages) ? threadMessages.length : "loading"
      // })

      if (!autoResume) return;
      if (!threadId) return;
      if (!thread?.isLive || !thread.currentStreamId) return;

      // Don't resume if we're currently streaming
      if (status === "streaming") return;

      // CRITICAL: Don't resume until backend messages are loaded
      // This prevents resuming with empty message history
      if (!threadMessages || "error" in threadMessages) {
         console.log("[AR:waiting_for_messages]", { threadId: threadId.slice(0, 8) });
         return;
      }

      // Case 1: We're already attached to the current stream - no need to resume
      if (attachedStreamId === thread.currentStreamId) {
         return;
      }

      // Case 2: We have a different attachedStreamId - this is a genuine resume case
      if (attachedStreamId !== undefined && attachedStreamId !== thread.currentStreamId) {
         // Don't resume if we initiated this stream ourselves
         if (pending) {
            console.log("[AR:skip_resume]", {
               t: threadId,
               pending,
               current: thread.currentStreamId?.slice(0, 5),
               attached: attachedStreamId?.slice(0, 5),
               reason: "pending_new_message",
            });
            return;
         }

         console.log("[AR:resume]", {
            t: threadId,
            isLive: thread?.isLive,
            pending,
            current: thread.currentStreamId?.slice(0, 5),
            attached: attachedStreamId?.slice(0, 5),
            reason: "different_stream",
            msgsCount: threadMessages.length,
         });
         experimental_resume();
         setAttachedStreamId(threadId, thread.currentStreamId);
         return;
      }

      // Case 3: attachedStreamId is undefined - could be new message or reload
      if (attachedStreamId === undefined) {
         // If pending is true, we initiated this stream, so don't resume
         if (pending) {
            return;
         }

         // This is likely a reload case - thread is live but we have no attached stream
         console.log("[AR:resume]", {
            t: threadId,
            isLive: thread?.isLive,
            pending,
            current: thread.currentStreamId?.slice(0, 5),
            attached: "undefined",
            reason: "reload_case",
            msgsCount: threadMessages.length,
         });
         experimental_resume();
         setAttachedStreamId(threadId, thread.currentStreamId);
         return;
      }
   }, [
      autoResume,
      thread?.isLive,
      thread?.currentStreamId,
      threadId,
      attachedStreamId,
      pending,
      experimental_resume,
      status,
      setAttachedStreamId,
      threadMessages,
   ]);
}
