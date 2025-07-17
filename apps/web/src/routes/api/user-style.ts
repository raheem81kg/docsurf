// Server route for analyzing user writing style using Gemini 2.5 Flash
// POST only. Analyzes writing sample and returns style summary.

import { createServerFileRoute } from "@tanstack/react-start/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { fetchAuth } from "../__root";
import { Ratelimit } from "@upstash/ratelimit";
import { client as redisClient } from "@docsurf/kv/index";

export const ServerRoute = createServerFileRoute("/api/user-style").methods({
   POST: async ({ request }) => {
      // Get userId from fetchAuth
      const { userId } = await fetchAuth();

      if (!userId) {
         return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
         });
      }

      // Rate limiting for style analysis (less frequent than inline suggestions)
      const ratelimit = new Ratelimit({
         limiter: Ratelimit.fixedWindow(10, "1 h"), // 10 requests per hour
         redis: redisClient,
         prefix: "ai-style-analysis",
      });

      const { success, remaining, limit, reset } = await ratelimit.limit(userId);
      if (!success) {
         return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: {
               "Content-Type": "application/json",
               "X-RateLimit-Limit": limit.toString(),
               "X-RateLimit-Remaining": remaining.toString(),
               "X-RateLimit-Reset": reset.toString(),
            },
         });
      }

      try {
         const { sampleText } = await request.json();

         if (typeof sampleText !== "string" || sampleText.trim().length < 200) {
            return new Response(JSON.stringify({ error: "Please provide at least 200 characters of sample text." }), {
               status: 400,
               headers: { "Content-Type": "application/json" },
            });
         }

         if (sampleText.length > 5000) {
            return new Response(JSON.stringify({ error: "Sample text is too long. Please limit to 5000 characters." }), {
               status: 400,
               headers: { "Content-Type": "application/json" },
            });
         }

         const analysisPrompt = `You are a literary style analyst. Summarize the distinctive writing style of the author in 2-4 concise sentences, focusing on tone, vocabulary, sentence structure, and any notable quirks. Do not mention the author in third person; instead, describe the style directly (e.g., "Uses short, punchy sentences and casual slang."). Text to analyse is delimited by triple quotes.\n\n"""${sampleText}"""`;

         const google = createGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
         });

         const { fullStream } = streamText({
            model: google.languageModel("gemini-2.0-flash-lite"),
            system: "You are an expert writing assistant and literary style analyst.",
            prompt: analysisPrompt,
            temperature: 0.3,
            maxTokens: 150,
         });

         let summary = "";
         for await (const delta of fullStream) {
            if (delta.type === "text-delta") {
               summary += delta.textDelta;
            }
         }

         return new Response(JSON.stringify({ summary: summary.trim() }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
         });
      } catch (error) {
         console.error("[user-style] Error:", error);

         const errorMessage = error instanceof Error ? error.message : "Failed to analyze style.";
         return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
         });
      }
   },
});
