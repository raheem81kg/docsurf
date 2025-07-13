import { type OpenAIProvider, createOpenAI } from "@ai-sdk/openai";
import type { ImageModelV1, LanguageModelV1 } from "@ai-sdk/provider";
import { ChatError } from "@docsurf/utils/errors";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { getUserIdentity } from "../lib/identity";
import { type CoreProvider, CoreProviders, MODELS_SHARED, createProvider } from "../lib/models";

export const getModel = async (ctx: ActionCtx, modelId: string) => {
   const user = await getUserIdentity(ctx, { allowAnons: false });
   if ("error" in user) throw new ChatError("unauthorized:chat");

   const registry = await ctx.runQuery(internal.settings.getUserRegistryInternal, {
      userId: user.id,
   });

   if (!(modelId in registry.models)) return new ChatError("bad_model:api");

   const model = registry.models[modelId];
   if (!model) return new ChatError("bad_model:api");
   if (!model.adapters.length) return new ChatError("bad_model:api", "No adapters found for model");

   // Priority sorting: BYOK Core Providers > OpenRouter > Server (i3-)
   const sortedAdapters = model.adapters.sort((a, b) => {
      const providerA = a.split(":")[0];
      const providerB = b.split(":")[0];

      const getPriority = (provider: string) => {
         if (CoreProviders.includes(provider as CoreProvider)) return 1; // User BYOK key (if present)
         if (provider === "openrouter") return 2; // OpenRouter (always charged)
         if (provider.startsWith("i3-")) return 3; // Internal (always charged)
         return 4; // Custom
      };

      return getPriority(providerA) - getPriority(providerB);
   });

   console.log("[getModel] model", model, "sortedAdapters", sortedAdapters);
   let finalModel: LanguageModelV1 | ImageModelV1 | undefined = undefined;
   let charged = true; // default: charge unless proven BYOK

   for (const adapter of sortedAdapters) {
      const providerIdRaw = model.customProviderId ?? adapter.split(":")[0];
      const providerSpecificModelId = model.customProviderId ? model.id : adapter.split(":")[1];
      let usingUserKey = false;

      // --- Provider selection and charged flag logic ---
      // 1. i3- (internal): always charged, only used if no BYOK key is present
      // 2. openrouter: always charged
      // 3. Core provider (e.g., openai):
      //    - If user has a key, it's BYOK (not charged)
      //    - If no user key, fallback to i3- (charged)
      // 4. Custom provider: always BYOK (not charged)
      const provider = registry.providers[providerIdRaw];
      console.log("[getModel] adapter:", adapter, "providerIdRaw:", providerIdRaw, "provider:", provider);
      if (providerIdRaw.startsWith("i3-")) {
         // Internal adapter: always charged, only used if no BYOK key is present
         charged = true;
      } else if (providerIdRaw === "openrouter") {
         // OpenRouter: treat as BYOK if user has supplied a key
         if (provider?.key) {
            usingUserKey = true;
         }
         charged = !usingUserKey;
      } else if (CoreProviders.includes(providerIdRaw as CoreProvider)) {
         // Core provider: if user has a key, it's BYOK (not charged)
         if (provider?.key) {
            usingUserKey = true;
         }
         charged = !usingUserKey;
      } else {
         // Custom provider: always BYOK (not charged)
         usingUserKey = true;
         charged = false;
      }
      // --- End provider selection logic ---
      console.log("[getModel] usingUserKey:", usingUserKey, "charged:", charged);

      // --- Adapter instantiation (unchanged) ---
      if (providerIdRaw.startsWith("i3-")) {
         const providerId = providerIdRaw.slice(3) as CoreProvider;
         const sdk_provider = createProvider(providerId, "internal");

         //last check that this model actually is in MODELS_SHARED
         if (!MODELS_SHARED.some((m) => m.adapters.some((a) => a === `i3-${providerId}:${providerSpecificModelId}`))) {
            console.error(`Model ${providerSpecificModelId} not found in internal modelset`);
            continue;
         }

         if (model.mode === "image") {
            if (!sdk_provider.imageModel) {
               console.error(`Provider ${providerId} does not support image models`);
               continue;
            }
            finalModel = sdk_provider.imageModel(providerSpecificModelId);
         } else {
            if (providerId === "openai") {
               finalModel = (sdk_provider as OpenAIProvider).responses(providerSpecificModelId);
            } else {
               finalModel = sdk_provider.languageModel(providerSpecificModelId);
            }
         }
         break;
      }

      if (!provider) {
         console.error(`Provider ${providerIdRaw} not found`);
         continue;
      }

      if (["openrouter", ...CoreProviders].includes(providerIdRaw)) {
         const sdk_provider = createProvider(providerIdRaw as CoreProvider, provider.key);
         if (model.mode === "image") {
            if (!sdk_provider.imageModel) {
               console.error(`Provider ${providerIdRaw} does not support image models`);
               continue;
            }
            finalModel = sdk_provider.imageModel(providerSpecificModelId);
         } else {
            if (providerIdRaw === "openai") {
               finalModel = (sdk_provider as OpenAIProvider).responses(providerSpecificModelId);
            } else {
               finalModel = sdk_provider.languageModel(providerSpecificModelId);
            }
         }
         break;
      }

      //custom openai-compatible provider
      if (!provider.endpoint) {
         console.error(`Provider ${providerIdRaw} does not have a valid endpoint`);
         continue;
      }
      const sdk_provider = createOpenAI({
         baseURL: provider.endpoint,
         apiKey: provider.key,
         compatibility: "compatible",
         name: provider.name,
      });
      if (model.mode === "image") {
         if (!sdk_provider.imageModel) {
            console.error(`Provider ${providerIdRaw} does not support image models`);
            continue;
         }
         finalModel = sdk_provider.imageModel(providerSpecificModelId);
      } else {
         finalModel = sdk_provider.languageModel(providerSpecificModelId);
      }
      break;
   }

   if (!finalModel) return new ChatError("bad_model:api");

   Object.assign(finalModel, {
      modelType: "maxImagesPerCall" in finalModel ? "image" : "text",
   });

   if (typeof charged !== "boolean") {
      throw new Error("charged must be set to true or false before returning from getModel");
   }

   return {
      model: finalModel as (LanguageModelV1 & { modelType: "text" }) | (ImageModelV1 & { modelType: "image" }),
      abilities: model.abilities,
      registry,
      modelId: model.id,
      modelName: model.name ?? model.id,
      charged, // <-- add this
   };
};
