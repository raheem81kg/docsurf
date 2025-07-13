import type { FileUIPart, ReasoningUIPart, TextUIPart, ToolInvocationUIPart } from "@ai-sdk/ui-utils";
import { formatDataStreamPart } from "ai";
import { nanoid } from "nanoid";

import { ChatError } from "@docsurf/utils/errors";
import type { ReasoningEffort } from "@docsurf/utils/chat/model-store";
import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { createDataStream, smoothStream, streamText } from "ai";
import type { Infer } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { httpAction } from "../_generated/server";
import { dbMessagesToCore } from "../lib/db_to_core_messages";
import type { AbilityId, ImageSize } from "@docsurf/utils/chat/chat-constants";
import { getResumableStreamContext } from "../lib/resumable_stream_context";
import { getToolkit } from "../lib/toolkit";
import type { HTTPAIMessage } from "../schema/message";
import type { ErrorUIPart } from "../schema/parts";
import { generateThreadName } from "./generate_thread_name";
import { getModel } from "./get_model";
import { generateAndStoreImage } from "./image_generation";
import { manualStreamTransform } from "./manual_stream_transform";
import { buildPrompt } from "./prompt";
import { RESPONSE_OPTS } from "./shared";
import { requireUserId } from "../users";
import { getUserIdentity } from "../lib/identity";
import { getCurrentPlan, FREE_PLAN } from "@docsurf/utils/constants/pricing";
import { RATE_LIMIT_ERROR } from "@docsurf/utils/constants/errors";

const buildGoogleProviderOptions = (modelId: string, reasoningEffort?: ReasoningEffort): GoogleGenerativeAIProviderOptions => {
   const options: GoogleGenerativeAIProviderOptions = {};

   if (modelId === "gemini-2.0-flash-image-generation") {
      options.responseModalities = ["TEXT", "IMAGE"];
   }

   if (reasoningEffort !== "off" && ["2.5-flash", "2.5-pro"].some((m) => modelId.includes(m))) {
      options.thinkingConfig = {
         includeThoughts: true,
         thinkingBudget: reasoningEffort === "low" ? 1000 : reasoningEffort === "medium" ? 6000 : 12000,
      };
   }

   return options;
};

const buildOpenAIProviderOptions = (modelId: string, reasoningEffort?: ReasoningEffort): OpenAIResponsesProviderOptions => {
   const options: OpenAIResponsesProviderOptions = {};

   if (["o1", "o3", "o4"].some((m) => modelId.includes(m)) && reasoningEffort !== "off") {
      options.reasoningEffort = reasoningEffort;
      options.reasoningSummary = "detailed";
   }

   return options;
};

const buildAnthropicProviderOptions = (modelId: string, reasoningEffort?: ReasoningEffort): AnthropicProviderOptions => {
   const options: AnthropicProviderOptions = {};

   if (reasoningEffort !== "off" && ["sonnet-4", "4-sonnet", "4-opus", "opus-4", "3.7"].some((m) => modelId.includes(m))) {
      options.thinking = {
         type: "enabled",
         budgetTokens: reasoningEffort === "low" ? 1000 : reasoningEffort === "medium" ? 6000 : 12000,
      };
   }

   return options;
};

export const chatPOST = httpAction(async (ctx, req) => {
   try {
      const body: {
         id?: string;
         message: Infer<typeof HTTPAIMessage>;
         model: string;
         proposedNewAssistantId: string;
         enabledTools: AbilityId[];
         targetFromMessageId?: string;
         targetMode?: "normal" | "edit" | "retry";
         imageSize?: ImageSize;
         mcpOverrides?: Record<string, boolean>;
         reasoningEffort?: ReasoningEffort;
         currentDocumentId?: Id<"documents">;
         workspaceId?: Id<"workspaces">;
      } = await req.json();

      if (body.targetFromMessageId && !body.id) {
         return new ChatError("bad_request:chat").toResponse();
      }

      // Get user
      const user = await getUserIdentity(ctx, { allowAnons: false });
      if ("error" in user) return new ChatError("unauthorized:chat").toResponse();

      // Fetch subscription (plan) for user
      const subscription = await ctx.runQuery(internal.subscriptions.getSubscription, {
         userId: user.id as Id<"users">,
      });

      // Fetch usage for user (last 1 day)
      const usage = await ctx.runQuery(internal.analytics.getUserUsageStats, {
         userId: user.id as Id<"users">,
         timeframe: "1d",
      });

      // Determine plan name
      const planName = subscription?.isPremium ? "Pro" : "Free";
      const plan = getCurrentPlan(planName);
      const planLimits = plan.limits;

      // Check usage against plan limits
      const requestsUsed = usage?.totalRequests ?? 0;
      // const tokensUsed = usage?.totalTokens ?? 0;
      const requestsLimit = planLimits.requests1d;

      console.log("requestsUsed", requestsUsed);
      console.log("requestsLimit", requestsLimit);
      // console.log("tokensUsed", tokensUsed);
      // console.log("tokensLimit", tokensLimit);

      if (requestsUsed >= requestsLimit) {
         return new Response(
            JSON.stringify({
               error: RATE_LIMIT_ERROR,
               message: "You have reached your daily usage limit. Upgrade for unlimited usage.",
            }),
            {
               status: 429,
               headers: { "Content-Type": "application/json" },
            }
         );
      }

      const mutationResult = await ctx.runMutation(internal.threads.createThreadOrInsertMessages, {
         threadId: body.id as Id<"threads">,
         authorId: user.id as Id<"users">,
         userMessage: "message" in body ? body.message : undefined,
         proposedNewAssistantId: body.proposedNewAssistantId,
         targetFromMessageId: body.targetFromMessageId,
         targetMode: body.targetMode,
      });

      if (mutationResult instanceof ChatError) return mutationResult.toResponse();
      if (!mutationResult) return new ChatError("bad_request:chat").toResponse();

      const dbMessages = await ctx.runQuery(internal.messages.getMessagesByThreadId, {
         threadId: mutationResult.threadId,
      });
      const streamId = await ctx.runMutation(internal.streams.appendStreamId, {
         threadId: mutationResult.threadId,
      });

      const modelData = await getModel(ctx, body.model);
      if (modelData instanceof ChatError) return modelData.toResponse();
      const { model, modelName, charged } = modelData;

      const mapped_messages = await dbMessagesToCore(dbMessages, modelData.abilities);

      const streamStartTime = Date.now();

      const remoteCancel = new AbortController();
      const parts: Array<
         TextUIPart | (ReasoningUIPart & { duration?: number }) | ToolInvocationUIPart | FileUIPart | Infer<typeof ErrorUIPart>
      > = [];

      const uploadPromises: Promise<void>[] = [];
      const settings = await ctx.runQuery(internal.settings.getUserSettingsInternal, {
         userId: user.id,
      });

      if (settings.mcpServers && settings.mcpServers.length > 0) {
         const enabledMcpServers = settings.mcpServers.filter((server) => {
            const overrideValue = body.mcpOverrides?.[server.name];
            if (overrideValue === undefined) return server.enabled;
            return overrideValue !== false;
         });

         if (enabledMcpServers.length > 0) {
            body.enabledTools.push("mcp");
         }
      }

      // Track token usage
      const totalTokenUsage = {
         promptTokens: 0,
         completionTokens: 0,
         reasoningTokens: 0,
      };

      const stream = createDataStream({
         execute: async (dataStream) => {
            await ctx.runMutation(internal.threads.updateThreadStreamingState, {
               threadId: mutationResult.threadId,
               isLive: true,
               streamStartedAt: streamStartTime,
               currentStreamId: streamId,
            });

            let nameGenerationPromise: Promise<string | ChatError> | undefined;
            if (!body.id) {
               nameGenerationPromise = generateThreadName(ctx, mutationResult.threadId, mapped_messages, user.id, settings);
            }

            dataStream.writeData({
               type: "thread_id",
               content: mutationResult.threadId,
            });

            dataStream.writeData({
               type: "stream_id",
               content: streamId,
            });

            dataStream.writeMessageAnnotation({
               type: "model_name",
               content: modelName,
            });

            if (model.modelType === "image") {
               console.log("[cvx][chat][stream] Image generation mode detected");

               // Extract the prompt from the user message
               const userMessage = mapped_messages.find((m) => m.role === "user");

               const prompt =
                  typeof userMessage?.content === "string"
                     ? userMessage.content
                     : userMessage?.content
                          .map((t) => (t.type === "text" ? t.text : undefined))
                          .filter((t) => t !== undefined)
                          .join(" ");

               if (typeof prompt !== "string" || !prompt.trim()) {
                  console.error("[cvx][chat][stream] No valid prompt found for image generation");
                  parts.push({
                     type: "error",
                     error: {
                        code: "unknown",
                        message:
                           "No prompt provided for image generation. Please provide a description of the image you want to create.",
                     },
                  });
                  dataStream.write(
                     formatDataStreamPart(
                        "error",
                        "No prompt provided for image generation. Please provide a description of the image you want to create."
                     )
                  );
               } else {
                  // Use the provided imageSize or fall back to default
                  const imageSize: ImageSize = (body.imageSize || "1:1") as ImageSize;

                  // Create mock tool call for image generation
                  const mockToolCall: ToolInvocationUIPart = {
                     type: "tool-invocation",
                     toolInvocation: {
                        state: "call",
                        args: {
                           imageSize,
                           prompt,
                        },
                        toolCallId: nanoid(),
                        toolName: "image_generation",
                     },
                  };

                  parts.push(mockToolCall);
                  dataStream.write(
                     formatDataStreamPart("tool_call", {
                        toolCallId: mockToolCall.toolInvocation.toolCallId,
                        toolName: mockToolCall.toolInvocation.toolName,
                        args: mockToolCall.toolInvocation.args,
                     })
                  );

                  // Patch the message with the tool call first
                  await ctx.runMutation(internal.messages.patchMessage, {
                     threadId: mutationResult.threadId,
                     messageId: mutationResult.assistantMessageId,
                     parts: parts,
                     metadata: {
                        modelId: body.model,
                        modelName,
                        serverDurationMs: Date.now() - streamStartTime,
                        charged,
                     },
                  });

                  try {
                     // Generate the image
                     const result = await generateAndStoreImage({
                        prompt,
                        imageSize,
                        imageModel: model,
                        modelId: body.model,
                        userId: user.id,
                        threadId: mutationResult.threadId,
                        actionCtx: ctx,
                     });

                     // Send tool result
                     dataStream.write(
                        formatDataStreamPart("tool_result", {
                           toolCallId: mockToolCall.toolInvocation.toolCallId,
                           result: {
                              assets: result.assets,
                              prompt: result.prompt,
                              modelId: result.modelId,
                           },
                        })
                     );

                     // Update parts with successful result
                     parts[0] = {
                        type: "tool-invocation",
                        toolInvocation: {
                           state: "result",
                           args: mockToolCall.toolInvocation.args,
                           result: {
                              assets: result.assets,
                              prompt: result.prompt,
                              modelId: result.modelId,
                           },
                           toolCallId: mockToolCall.toolInvocation.toolCallId,
                           toolName: "image_generation",
                        },
                     } satisfies ToolInvocationUIPart;
                  } catch (error) {
                     console.error("[cvx][chat][stream] Image generation failed:", error);

                     // Send error in tool result
                     const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                     dataStream.write(
                        formatDataStreamPart("tool_result", {
                           toolCallId: mockToolCall.toolInvocation.toolCallId,
                           result: {
                              error: errorMessage,
                           },
                        })
                     );

                     // Update parts with error
                     parts[0] = {
                        type: "tool-invocation",
                        toolInvocation: {
                           state: "result",
                           args: mockToolCall.toolInvocation.args,
                           result: {
                              error: errorMessage,
                           },
                           toolCallId: mockToolCall.toolInvocation.toolCallId,
                           toolName: "image_generation",
                        },
                     } satisfies ToolInvocationUIPart;
                  }
               }
            } else {
               // Pass the filtered settings (with MCP overrides applied) to the toolkit
               const filteredSettings = {
                  ...settings,
                  mcpServers: settings.mcpServers?.filter((server) => {
                     if (server.enabled === false) return false;
                     const overrideValue = body.mcpOverrides?.[server.name];
                     return overrideValue !== false;
                  }),
               };
               const result = streamText({
                  model: model,
                  maxSteps: 100,
                  abortSignal: remoteCancel.signal,
                  experimental_transform: smoothStream(),
                  toolCallStreaming: true,
                  tools: modelData.abilities.includes("function_calling")
                     ? await getToolkit(ctx, body.enabledTools, {
                          userSettings: filteredSettings,
                          currentDocumentId: body.currentDocumentId,
                          workspaceId: body.workspaceId,
                       })
                     : undefined,
                  messages: [
                     ...(modelData.modelId !== "gemini-2.0-flash-image-generation"
                        ? [
                             {
                                role: "system",
                                content: buildPrompt(body.enabledTools, settings),
                             } as const,
                          ]
                        : []),
                     ...mapped_messages,
                  ],
                  providerOptions: {
                     google: buildGoogleProviderOptions(modelData.modelId, body.reasoningEffort),
                     openai: buildOpenAIProviderOptions(modelData.modelId, body.reasoningEffort),
                     anthropic: buildAnthropicProviderOptions(modelData.modelId, body.reasoningEffort),
                  },
               });

               dataStream.merge(
                  result.fullStream.pipeThrough(
                     manualStreamTransform(parts, totalTokenUsage, mutationResult.assistantMessageId, uploadPromises, user.id, ctx)
                  )
               );

               await result.consumeStream();
               await Promise.allSettled(uploadPromises);
               console.log("uploadPromises", uploadPromises);
               console.log("parts", parts);
            }
            remoteCancel.abort();
            console.log();

            // Before saving, filter out HTML from get_current_document tool results to prevent DB bloat
            const partsToPersist = parts.map((part) => {
               if (
                  part.type === "tool-invocation" &&
                  (part.toolInvocation.toolName === "get_current_document" ||
                     part.toolInvocation.toolName === "get_current_document_html" ||
                     part.toolInvocation.toolName === "document_context") &&
                  part.toolInvocation.state === "result" &&
                  part.toolInvocation.result
               ) {
                  // Redact the HTML content before saving
                  const { html, ...restResult } = part.toolInvocation.result;
                  return {
                     ...part,
                     toolInvocation: {
                        ...part.toolInvocation,
                        result: restResult,
                     },
                  };
               }
               return part;
            });

            // In both image and text branches, when calling patchMessage, add 'charged' to metadata
            await ctx.runMutation(internal.messages.patchMessage, {
               threadId: mutationResult.threadId,
               messageId: mutationResult.assistantMessageId,
               parts:
                  partsToPersist.length > 0
                     ? partsToPersist
                     : [
                          {
                             type: "error",
                             error: {
                                code: "no-response",
                                message: "The model did not generate a response. Please try again.",
                             },
                          },
                       ],
               metadata: {
                  modelId: body.model,
                  modelName,
                  promptTokens: totalTokenUsage.promptTokens,
                  completionTokens: totalTokenUsage.completionTokens,
                  reasoningTokens: totalTokenUsage.reasoningTokens,
                  serverDurationMs: Date.now() - streamStartTime,
                  charged, // <-- propagate charged
               },
            });

            if (nameGenerationPromise) {
               const res = await nameGenerationPromise;
               if (res instanceof ChatError) res.toResponse();
            }

            await ctx
               .runMutation(internal.threads.updateThreadStreamingState, {
                  threadId: mutationResult.threadId,
                  isLive: false,
                  currentStreamId: undefined,
               })
               .catch((err) => console.error("Failed to update thread state:", err));
         },
         onError: (error) => {
            console.error("[cvx][chat][stream] Fatal error:", error);
            // Mark thread as not live on error
            ctx.runMutation(internal.threads.updateThreadStreamingState, {
               threadId: mutationResult.threadId,
               isLive: false,
            }).catch((err) => console.error("Failed to update thread state:", err));
            return "Stream error occurred";
         },
      });

      const streamContext = getResumableStreamContext();
      if (streamContext) {
         return new Response(
            (await streamContext.resumableStream(streamId, () => stream))?.pipeThrough(new TextEncoderStream()),
            RESPONSE_OPTS
         );
      }

      return new Response(stream.pipeThrough(new TextEncoderStream()), RESPONSE_OPTS);
   } catch (error: any) {
      // Log the error for debugging
      console.error("[chatPOST] Uncaught error:", error);
      // Use statusCode if available, otherwise 500
      const status = error?.statusCode || 500;
      // Use error.message if available, otherwise generic
      const message = error?.message || "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
         status,
         headers: { "Content-Type": "application/json" },
      });
   }
});
