import { type AIConfig, loadAIConfig, saveAIConfig } from "./persistence";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AbilityId, ImageSize } from "./chat-constants";

export type ReasoningEffort = "off" | "low" | "medium" | "high";

export type ModelStore = {
   selectedModel: string | null;
   setSelectedModel: (model: string | null) => void;

   enabledTools: AbilityId[];
   setEnabledTools: (tools: AbilityId[]) => void;

   selectedImageSize: ImageSize;
   setSelectedImageSize: (imageSize: ImageSize) => void;

   reasoningEffort: ReasoningEffort;
   setReasoningEffort: (effort: ReasoningEffort) => void;

   mcpOverrides: Record<string, Record<string, boolean>>;
   setMcpOverride: (threadId: string, serverName: string, enabled: boolean) => void;
   getMcpOverrides: (threadId: string) => Record<string, boolean>;
   clearMcpOverrides: (threadId: string) => void;
   // Default overrides for new chats
   defaultMcpOverrides: Record<string, boolean>;
   setDefaultMcpOverride: (serverName: string, enabled: boolean) => void;
   getEffectiveMcpOverrides: (threadId?: string) => Record<string, boolean>;
};

const initialConfig = loadAIConfig();

const persistConfig = (
   selectedModel: string | null,
   enabledTools: AbilityId[],
   selectedImageSize: ImageSize,
   reasoningEffort: ReasoningEffort
) => {
   const config: AIConfig = { selectedModel, enabledTools, selectedImageSize, reasoningEffort };
   saveAIConfig(config);
};

export const useModelStore = create<ModelStore>()(
   persist(
      (set, get) => ({
         selectedModel: initialConfig.selectedModel,
         enabledTools: initialConfig.enabledTools as AbilityId[],
         selectedImageSize: initialConfig.selectedImageSize as ImageSize,
         reasoningEffort: initialConfig.reasoningEffort as ReasoningEffort,
         mcpOverrides: {},
         defaultMcpOverrides: {},
         setSelectedModel: (model) => {
            const currentState = get();
            if (currentState.selectedModel !== model) {
               set({ selectedModel: model });
               persistConfig(model, currentState.enabledTools, currentState.selectedImageSize, currentState.reasoningEffort);
            }
         },
         setEnabledTools: (tools) => {
            const currentState = get();
            const hasChanged =
               tools.length !== currentState.enabledTools.length ||
               tools.some((tool, index) => tool !== currentState.enabledTools[index]);

            if (hasChanged) {
               set({ enabledTools: tools });
               persistConfig(currentState.selectedModel, tools, currentState.selectedImageSize, currentState.reasoningEffort);
            }
         },
         setSelectedImageSize: (imageSize) => {
            const currentState = get();
            if (currentState.selectedImageSize !== imageSize) {
               set({ selectedImageSize: imageSize });
               persistConfig(currentState.selectedModel, currentState.enabledTools, imageSize, currentState.reasoningEffort);
            }
         },
         setReasoningEffort: (effort) => {
            const currentState = get();
            if (currentState.reasoningEffort !== effort) {
               set({ reasoningEffort: effort });
               persistConfig(currentState.selectedModel, currentState.enabledTools, currentState.selectedImageSize, effort);
            }
         },
         setMcpOverride: (threadId, serverName, enabled) => {
            console.log("[Store] setMcpOverride called:", { threadId, serverName, enabled });
            set((state) => {
               const newOverrides = {
                  ...state.mcpOverrides,
                  [threadId]: {
                     ...state.mcpOverrides[threadId],
                     [serverName]: enabled,
                  },
               };
               console.log("[Store] New thread overrides:", newOverrides);
               return { mcpOverrides: newOverrides };
            });
         },
         getMcpOverrides: (threadId) => get().mcpOverrides[threadId] || {},
         clearMcpOverrides: (threadId) =>
            set((state) => {
               const newOverrides = { ...state.mcpOverrides };
               delete newOverrides[threadId];
               return { mcpOverrides: newOverrides };
            }),
         setDefaultMcpOverride: (serverName, enabled) => {
            console.log("[Store] setDefaultMcpOverride called:", { serverName, enabled });
            set((state) => {
               const newDefaults = {
                  ...state.defaultMcpOverrides,
                  [serverName]: enabled,
               };
               console.log("[Store] New default overrides:", newDefaults);
               return { defaultMcpOverrides: newDefaults };
            });
         },
         getEffectiveMcpOverrides: (threadId) => {
            const currentState = get();
            console.log("[Store] getEffectiveMcpOverrides called:", { threadId });
            console.log("[Store] Current state:", {
               defaultMcpOverrides: currentState.defaultMcpOverrides,
               threadOverrides: currentState.mcpOverrides[threadId || ""] || {},
            });

            // If no threadId, return default overrides
            if (!threadId) {
               const result = { ...currentState.defaultMcpOverrides };
               console.log("[Store] Returning default overrides:", result);
               return result;
            }
            // Combine thread-specific overrides with defaults (thread-specific takes precedence)
            const result = {
               ...currentState.defaultMcpOverrides,
               ...(currentState.mcpOverrides[threadId] || {}),
            };
            console.log("[Store] Returning combined overrides:", result);
            return result;
         },
      }),
      {
         name: "model-storage",
      }
   )
);
