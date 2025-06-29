// Server route for streaming inline AI suggestions using Gemini 2.5 Flash (Google Generative AI)
// POST only. Streams suggestions as event-stream for inline editor usage.

import { createServerFileRoute } from "@tanstack/react-start/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { smoothStream, streamText } from "ai";
import { fetchAuth } from "../__root";
// ... other imports as in the provided code (leave out missing imports)

export const ServerRoute = createServerFileRoute("/api/inline-suggestion").methods({
   GET: async ({ request }) => {
      // Parse query parameters
      const url = new URL(request.url);
      const documentId = url.searchParams.get("documentId") ?? undefined;
      // const userId = url.searchParams.get("userId") ?? undefined; // Remove this
      const currentContent = url.searchParams.get("currentContent") ?? "";
      const contextAfter = url.searchParams.get("contextAfter") ?? "";
      const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
      // Optionally: suggestionLength, customInstructions
      // const suggestionLength = url.searchParams.get("suggestionLength") as "short" | "medium" | "long" | undefined;
      // const customInstructions = url.searchParams.get("customInstructions") ?? undefined;

      // Get userId from fetchAuth
      const { userId } = await fetchAuth();
      if (!userId) {
         return new Response(JSON.stringify({ error: { message: "Unauthorized", description: "No user session." } }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
         });
      }

      if (!documentId) {
         return new Response(
            JSON.stringify({ error: { message: "Document ID is required", description: "No document ID provided." } }),
            {
               status: 400,
               headers: { "Content-Type": "application/json" },
            }
         );
      }

      // Call the real AI handler (no document validation)
      return await handleInlineSuggestionRequest(
         documentId!,
         currentContent,
         userId
         // suggestionLength ?? "medium",
         // customInstructions
      );
   },
});

async function handleInlineSuggestionRequest(
   documentId: string,
   currentContent: string,
   userId: string,
   suggestionLength: "short" | "medium" | "long" = "long",
   customInstructions?: string | null | undefined
) {
   // No document fetching/validation
   const stream = new TransformStream();
   const writer = stream.writable.getWriter();
   const encoder = new TextEncoder();
   let writerClosed = false;

   // Dummy word usage tracker
   const wordTracker = dummyWordUsageTracker(userId);

   (async () => {
      try {
         await streamInlineSuggestion({
            documentId,
            currentContent,
            suggestionLength,
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

async function streamInlineSuggestion({
   currentContent,
   suggestionLength,
   customInstructions,
   write,
}: {
   documentId: string;
   currentContent: string;
   suggestionLength: "short" | "medium" | "long";
   customInstructions?: string | null | undefined;
   write: (type: string, content: string) => Promise<void>;
}) {
   const prompt = buildPrompt(currentContent, suggestionLength, customInstructions);
   console.log("Prompt sent to Gemini:", prompt);
   // Increase maxTokens for debugging
   const maxTokens = { short: 100, medium: 200, long: 300 }[suggestionLength || "long"];

   // Use Gemini 2.5 Flash Lite model for faster response
   const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
   });
   const { fullStream } = streamText({
      model: google.languageModel("gemini-2.0-flash-lite"),
      system: getSystemPrompt(),
      prompt,
      experimental_transform: smoothStream({
         chunking: "word",
      }),
      temperature: 0.4,
      maxTokens,
   });

   let suggestionContent = "";
   for await (const delta of fullStream) {
      const { type } = delta;
      if (type === "text-delta") {
         const { textDelta } = delta;
         console.log("Gemini textDelta:", textDelta);
         suggestionContent += textDelta;
         await write("suggestion-delta", textDelta);
      }
   }
}

function getSystemPrompt(): string {
   const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      weekday: "short",
   });
   return `You are an advanced AI writing assistant that generates natural, contextually relevant text completions. Your task is to predict and generate the next part of the text based on the given context.\n\nToday's date is ${today}.\n\n### Core Rules:\n1. Write naturally and maintain consistent flow, formality, formatting, and tone\n2. Complete thoughts and sentences properly\n3. Never include the [CURSOR] marker in output\n4. Adapt to the document's style and purpose \n5. Provide contextually appropriate completions\n6. Avoid unnecessary repetition of existing content\n\n### Writing Style:\n- Match the tone and style of the existing text\n- Write as naturally as possible, like a real person\n- Be flexible and adapt to different writing contexts\n- Maintain the voice and personality of the text\n- Use appropriate language for the context (formal, casual, technical, etc.)\n\n### Formatting:\n- Start from [CURSOR] position\n- Match the document's style (capitalization, punctuation, spacing)\n- Output only the raw completion text\n- No markdown, code blocks, or meta-commentary\n- Preserve the natural flow of the text`;
}

function buildPrompt(
   currentContent: string,
   suggestionLength: "short" | "medium" | "long" = "long",
   customInstructions?: string | null
): string {
   const contextWindow = 200;
   const relevantContent = currentContent.slice(-contextWindow);
   const lengthMap = { short: "at least 8 words", medium: "at least 12 words", long: "at least 20 words" };
   const lengthInstruction = lengthMap[suggestionLength] || lengthMap.medium;
   let promptContent = `Text before cursor:\n${relevantContent}[CURSOR] Continue the text from the [CURSOR] position. Write a natural, flowing continuation of ${lengthInstruction}, but no more than 30. Do not repeat any text that appears before the cursor. Output only the new continuation, and do not stop after a single phrase.`;
   if (customInstructions) {
      promptContent = `${customInstructions}\n\n${promptContent}`;
   } else {
      promptContent = `${getSystemPrompt()}\n\n${promptContent}`;
   }
   promptContent += " This is a guideline, not a strict requirement—be flexible if needed.";
   return promptContent;
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
