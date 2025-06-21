import { Infer, v } from "convex/values";
import { CoreProviders } from "../lib/models";

const ModelAbilitySchema = v.union(
   v.literal("reasoning"),
   v.literal("vision"),
   v.literal("function_calling"),
   v.literal("pdf"),
   v.literal("effort_control")
);
export type ModelAbility = Infer<typeof ModelAbilitySchema>;

export const CoreAIProvider = v.object({
   enabled: v.boolean(),
   encryptedKey: v.string(),
});

const CoreProvidersSchema = v.union(...CoreProviders.map((p) => v.literal(p)), v.literal("openrouter"));

export const CustomModel = v.object({
   enabled: v.boolean(),
   name: v.optional(v.string()),
   modelId: v.string(),
   providerId: v.union(CoreProvidersSchema, v.string()),
   contextLength: v.number(),
   maxTokens: v.number(),
   abilities: v.array(ModelAbilitySchema),
});

export const UserCustomization = v.object({
   name: v.optional(v.string()),
   aiPersonality: v.optional(v.string()),
   additionalContext: v.optional(v.string()),
});

export const NonSensitiveUserSettings = v.object({
   userId: v.string(),
   searchProvider: v.union(v.literal("firecrawl"), v.literal("brave"), v.literal("tavily"), v.literal("serper")),
   searchIncludeSourcesByDefault: v.boolean(),
   customModels: v.record(v.string(), CustomModel),
   titleGenerationModel: v.string(),
   customization: v.optional(UserCustomization),
   onboardingCompleted: v.optional(v.boolean()),
});

export const GeneralProviderConfig = v.object({
   enabled: v.boolean(),
   encryptedKey: v.string(),
});

export const CustomAIProvider = v.object({
   name: v.string(),
   enabled: v.boolean(),
   endpoint: v.string(),
   encryptedKey: v.string(),
});

export const UserSettings = v.object({
   ...NonSensitiveUserSettings.fields,
   coreAIProviders: v.record(v.string(), CoreAIProvider),
   customAIProviders: v.record(v.string(), CustomAIProvider),
   generalProviders: v.object({
      supermemory: v.optional(GeneralProviderConfig),
      firecrawl: v.optional(GeneralProviderConfig),
      tavily: v.optional(GeneralProviderConfig),
   }),
});
