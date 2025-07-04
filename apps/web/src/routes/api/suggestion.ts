// Server route for streaming AI suggestions using Gemini 2.5 Flash (Google Generative AI)
// Streams suggestions as event-stream for suggestion editor usage.

import { createServerFileRoute } from "@tanstack/react-start/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { smoothStream, streamText } from "ai";
import { fetchAuth } from "../__root";
import { Ratelimit } from "@upstash/ratelimit";
import { client as redisClient } from "@docsurf/kv/index";
// ... other imports as in the provided code (leave out missing imports)

export const ServerRoute = createServerFileRoute("/api/suggestion").methods({
   // GET: async ({ request }) => {
   //    // Parse query parameters
   //    const url = new URL(request.url);
   //    const documentId = url.searchParams.get("documentId") ?? undefined;
   //    const description = url.searchParams.get("description") ?? undefined;
   //    const selectedText = url.searchParams.get("selectedText") ?? undefined;
   //    const suggestionLength = (url.searchParams.get("suggestionLength") as "short" | "medium" | "long") || "medium";
   //    const customInstructions = url.searchParams.get("customInstructions") ?? undefined;

   //    // Get userId from fetchAuth
   //    const { userId } = await fetchAuth();
   //    if (!userId) {
   //       return new Response(JSON.stringify({ error: { message: "Unauthorized", description: "No user session." } }), {
   //          status: 401,
   //          headers: { "Content-Type": "application/json" },
   //       });
   //    }
   //    if (!documentId || !description) {
   //       return new Response(
   //          JSON.stringify({ error: { message: "Missing parameters", description: "documentId and description required." } }),
   //          {
   //             status: 400,
   //             headers: { "Content-Type": "application/json" },
   //          }
   //       );
   //    }
   //    return await handleSuggestionRequest(documentId, description, userId, selectedText, suggestionLength, customInstructions);
   // },
   POST: async ({ request }) => {
      const { documentId, description, selectedText, aiOptions = {}, workspaceId } = await request.json();
      const { customInstructions = undefined } = aiOptions;
      const { userId } = await fetchAuth();
      if (!userId) {
         return new Response(JSON.stringify({ error: { message: "Unauthorized", description: "No user session." } }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
         });
      }
      // --- Upstash Rate Limiting by userId ---
      const ratelimit = new Ratelimit({
         limiter: Ratelimit.fixedWindow(100, "1 d"),
         redis: redisClient,
         prefix: "ai-suggestion",
      });
      const { success, remaining, limit, reset } = await ratelimit.limit(userId);
      if (!success) {
         return new Response("You have reached your request limit for the day.", {
            status: 429,
            headers: {
               "X-RateLimit-Limit": limit.toString(),
               "X-RateLimit-Remaining": remaining.toString(),
               "X-RateLimit-Reset": reset.toString(),
            },
         });
      }
      // --- End Rate Limiting ---
      if (!workspaceId) {
         return new Response(
            JSON.stringify({ error: { message: "Workspace ID is required", description: "No workspace ID provided." } }),
            {
               status: 400,
               headers: { "Content-Type": "application/json" },
            }
         );
      }
      if (!documentId || !description) {
         return new Response(
            JSON.stringify({ error: { message: "Missing parameters", description: "documentId and description required." } }),
            {
               status: 400,
               headers: { "Content-Type": "application/json" },
            }
         );
      }
      return await handleSuggestionRequest(documentId, description, userId, selectedText, customInstructions);
   },
});

async function handleSuggestionRequest(
   documentId: string,
   description: string,
   userId: string,
   selectedText?: string,
   customInstructions?: string | null | undefined
) {
   // No document fetching/validation, just stream suggestion
   const stream = new TransformStream();
   const writer = stream.writable.getWriter();
   const encoder = new TextEncoder();
   let writerClosed = false;

   // Dummy word usage tracker
   const wordTracker = dummyWordUsageTracker(userId);

   (async () => {
      try {
         // Send documentId as first event
         await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "id", content: documentId })}\n\n`));
         // Send original/clear event
         if (selectedText) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "original", content: selectedText })}\n\n`));
         } else {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "clear", content: "" })}\n\n`));
         }
         await streamSuggestion({
            documentId,
            description,
            selectedText,
            customInstructions,
            write: async (type, content) => {
               if (writerClosed) return;
               try {
                  if (type === "suggestion-delta") {
                     wordTracker.processChunk({ chunk: { type: "text-delta", textDelta: content } });
                  }
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type, content })}\n\n`));
               } catch (error) {
                  console.error("Error writing to stream:", error);
               }
            },
         });
         try {
            wordTracker.trackUsage();
         } catch (error) {
            console.error("Failed to track word usage:", error);
         }
         if (!writerClosed) {
            try {
               await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "finish", content: "" })}\n\n`));
            } catch (error) {
               console.error("Error writing finish event:", error);
            }
         }
      } catch (e) {
         console.error("Error in stream processing:", e);
         if (!writerClosed) {
            try {
               const errorMsg = typeof e === "object" && e && "message" in e ? (e as any).message : "An error occurred";
               await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", content: errorMsg })}\n\n`));
            } catch (error) {
               console.error("Error writing error event:", error);
            }
         }
      } finally {
         if (!writerClosed) {
            try {
               writerClosed = true;
               await writer.close();
            } catch (error) {
               console.error("Error closing writer:", error);
            }
         }
      }
   })();

   try {
      return new Response(stream.readable, {
         headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
         },
      });
   } catch (error) {
      writerClosed = true;
      console.error("Error creating response:", error);
      return errorResponseWithFallback({
         error: {
            message: "Stream error",
            description: "Failed to create response stream.",
         },
      });
   }
}

async function streamSuggestion({
   documentId,
   description,
   selectedText,
   customInstructions,
   write,
}: {
   documentId: string;
   description: string;
   selectedText?: string;
   customInstructions?: string | null | undefined;
   write: (type: string, content: string) => Promise<void>;
}) {
   // Build prompt for suggestion
   const prompt = buildSuggestionPrompt(description, selectedText, customInstructions);
   const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
   });
   const { fullStream } = streamText({
      model: google.languageModel("gemini-2.0-flash"),
      system: getSuggestionSystemPrompt(),
      maxTokens: 600,
      prompt,
      experimental_transform: smoothStream({ chunking: "word" }),
      temperature: 0.4,
   });
   let suggestionContent = "";
   for await (const delta of fullStream) {
      const { type } = delta;
      if (type === "text-delta") {
         const { textDelta } = delta;
         suggestionContent += textDelta;
         await write("suggestion-delta", textDelta);
      }
   }
}

function getSuggestionSystemPrompt(): string {
   const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      weekday: "short",
   });
   return `You are an advanced AI writing assistant that generates natural, contextually relevant text suggestions. Your task is to rewrite, improve, or extend text based on user instructions.\n\nToday's date is ${today}.\n\n### Core Guidelines:\n1. Write naturally and maintain flow that fits the context\n2. Be creative and flexible in your approach\n3. Adapt to any writing style, tone, or format requested\n4. Feel free to be comprehensive or concise as the situation demands\n5. You can expand, contract, restructure, or completely reimagine content\n6. Match the user's intent, even if it means departing from the original style\n\n### Approach:\n- Be adaptable to any request or writing context\n- Write with creativity and intelligence\n- Consider the user's specific needs and preferences\n- Don't be overly constrained by the original text if changes are requested\n- Output should be ready to use without additional editing\n\n### Output:\n- Provide only the suggested text\n- No explanations, meta-commentary, or formatting markers\n- Focus on delivering exactly what the user needs`;
}

function buildSuggestionPrompt(description: string, selectedText?: string, customInstructions?: string | null | undefined): string {
   let promptContext = selectedText
      ? 'You are helping to improve some text based on a specific instruction.\n\nOriginal text:\n"""\n' +
        selectedText +
        '\n"""\n\nInstruction: "' +
        description +
        '"'
      : description;

   if (customInstructions) {
      promptContext = `${customInstructions}\n\n${promptContext}`;
   }

   promptContext += "\n\nPlease provide your best response to fulfill this request.";

   if (selectedText) {
      promptContext +=
         "\n\nFocus on delivering the improved version of the text that meets the instruction. Be as creative and thorough as needed.";
   }

   return promptContext;
}

// Dummy usage check (always allow)
function dummyCheckWordsUsage(userId: string): boolean {
   return true;
}
// Dummy word usage tracker
function dummyWordUsageTracker(userId: string) {
   return {
      processChunk: (_: any) => {},
      trackUsage: () => {},
   };
}
function errorResponseWithFallback(errorBody: { error: { message: string; description: string } }) {
   return new Response(JSON.stringify(errorBody), {
      status: 500,
      headers: { "Content-Type": "application/json" },
   });
}
