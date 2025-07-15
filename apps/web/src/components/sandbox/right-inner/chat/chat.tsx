import { Messages } from "./messages";
import { DefaultSettings } from "@docsurf/backend/convex/settings";
import { useChatActions } from "./hooks/use-chat-actions";
import { useChatDataProcessor } from "./hooks/use-chat-data-processor";
import { useChatIntegration } from "./hooks/use-chat-integration";
import { useDynamicTitle } from "./hooks/use-dynamic-title";
import { useThreadSync } from "./hooks/use-thread-sync";
import { type UploadedFile, useChatStore } from "./lib/chat-store";
import { useModelStore } from "@docsurf/utils/chat/model-store";
import { useAvailableModels } from "./lib/models-providers-shared";
import { useDiskCachedQuery } from "./lib/convex-cached-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { MultimodalInput } from "./multimodal-input";
import { SignupMessagePrompt } from "./signup-message-prompt";
import { StickToBottomButton } from "./stick-to-bottom-button";
import { useSession } from "@/hooks/auth-hooks";
import { ChatHeader } from "./chat-header";
import { useConvexAuth } from "convex/react";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useCurrentDocument } from "@/components/sandbox/left/_tree_components/SortableTree";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { Analytics } from "@/components/providers/posthog";

interface ChatProps {
   threadId: string | undefined;
   // folderId?: Id<"projects">;
}

const ChatContent = ({ threadId: routeThreadId }: ChatProps) => {
   const { selectedModel, setSelectedModel } = useModelStore();
   const { threadId } = useThreadSync({ routeThreadId });
   const { scrollToBottom, isAtBottom, contentRef, scrollRef } = useStickToBottom({
      initial: "instant",
      resize: "instant",
   });
   const { data: session, isPending } = useSession();
   const auth = useConvexAuth();
   useDynamicTitle({ threadId });

   // Get user settings for available models
   const userSettings = useDiskCachedQuery(
      api.settings.getUserSettings,
      {
         key: "user-settings",
         default: DefaultSettings(session?.user?.id ?? "CACHE"),
         forceCache: true,
      },
      session?.user?.id && !auth.isLoading ? {} : "skip"
   );

   const { data: user } = useQuery({
      ...convexQuery(api.auth.getCurrentUser, {}),
      enabled: !!session?.user,
   });
   const hasPro = !!user?.subscription?.isPremium;
   const { doc: currentDocument } = useCurrentDocument(user);

   // Get available models based on user's API keys
   const { availableModels } = useAvailableModels(
      "error" in userSettings ? DefaultSettings(session?.user?.id ?? "") : userSettings,
      hasPro
   );

   // Set default model to first available model (not first in MODELS_SHARED)
   useMemo(() => {
      if (!selectedModel && availableModels.length > 0) {
         setSelectedModel(availableModels[0].id);
      }
   }, [selectedModel, setSelectedModel, availableModels]);

   // const projects = useDiskCachedQuery(
   //    api.folders.getUserProjects,
   //    {
   //       key: "projects",
   //       default: [],
   //    },
   //    session?.user?.id ? {} : "skip"
   // );
   // const project = "error" in projects ? null : projects?.find((project) => project._id === folderId);

   const { status, data, messages, ...chatHelpers } = useChatIntegration({
      threadId,
      currentDocumentId: currentDocument?._id as Id<"documents">,
   });

   const { handleInputSubmit, handleRetry, handleEditAndRetry } = useChatActions({
      threadId,
      currentDocumentId: currentDocument?._id as Id<"documents">,
   });

   useChatDataProcessor({ data, messages });

   const handleInputSubmitWithScroll = (inputValue?: string, fileValues?: UploadedFile[]) => {
      handleInputSubmit(inputValue, fileValues);
      scrollToBottom({ animation: "smooth" });
   };

   const isEmpty = messages.length === 0 && !threadId;

   const userName = session?.user?.name ?? (isPending ? localStorage.getItem("DISK_CACHE:user-name") : null);

   useEffect(() => {
      if (!session?.user?.name || isPending) return;
      localStorage.setItem("DISK_CACHE:user-name", session.user.name);
   }, [session?.user?.name, isPending]);

   const { resetChat } = useChatStore();

   const resetAll = () => {
      console.log("[chat] resetAll");

      chatHelpers.setData([]);
      chatHelpers.setMessages([]);
      resetChat();
      Analytics.track("reset_chat", { userEmail: session?.user?.email });
   };

   useEffect(() => {
      document.addEventListener("new_chat", resetAll);
      return () => {
         document.removeEventListener("new_chat", resetAll);
      };
   }, [threadId]);

   if (!session?.user && !isPending) {
      return (
         <div className="relative flex h-[calc(100dvh-64px)] items-center justify-center">
            <SignupMessagePrompt key="signup-prompt" />
         </div>
      );
   }

   return (
      <div className="relative flex flex-col h-full overflow-hidden">
         <ChatHeader className="flex-none" />
         <Messages
            className="flex-1"
            messages={messages}
            onRetry={handleRetry}
            onEditAndRetry={handleEditAndRetry}
            status={status}
            contentRef={contentRef}
            scrollRef={scrollRef}
         />

         <AnimatePresence mode="sync">
            {isEmpty ? (
               <motion.div
                  key="centered-input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
               >
                  <div className="mb-6 size-16 rounded-full opacity-80">
                     <img src="/logo-black.png" alt="DocSurf" className="dark:invert" width={58} height={58} />
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.2 }}
                     className="mb-8 text-center"
                  >
                     <h1 className="px-4 font-medium text-2xl text-foreground">
                        {userName ? `What do you want to explore, ${userName?.split(" ")[0]}?` : "What do you want to explore?"}
                     </h1>
                  </motion.div>

                  <motion.div
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ duration: 0.2 }}
                     className="w-full max-w-4xl px-4 pointer-events-auto"
                  >
                     <MultimodalInput onSubmit={handleInputSubmitWithScroll} status={status} />
                  </motion.div>
               </motion.div>
            ) : (
               <motion.div
                  key="bottom-input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="bottom-1 flex-none md:bottom-1 absolute inset-x-0 z-[10] flex flex-col items-center justify-center gap-2"
               >
                  <StickToBottomButton isAtBottom={isAtBottom} scrollToBottom={scrollToBottom} />
                  <MultimodalInput onSubmit={handleInputSubmitWithScroll} status={status} />
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export const Chat = ({ threadId }: ChatProps) => {
   // DO NOT PASS A KEY HERE UNDER ANY CIRCUMSTANCES
   // It will cause the chat to reset when the threadId changes
   // AND THIS WHILE MAKE THE FIRST MESSAGE IN CHAT BE STUCK IN LOADING
   return <ChatContent threadId={threadId} />;
};
