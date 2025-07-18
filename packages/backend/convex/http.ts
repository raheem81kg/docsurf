import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { betterAuthComponent } from "./auth";
import { polar } from "./polar";
import { corsRouter } from "convex-helpers/server/cors";
import { getFile, uploadFile } from "./attachments";
import { chatGET } from "./chat_http/get.route";
import { chatPOST } from "./chat_http/post.route";
import { transcribeAudio } from "./speech_to_text";
import { getConvexAppUrls } from "@docsurf/utils/envs";
import { components } from "./_generated/api";
import { createAuth } from "./auth_create";
const http = httpRouter();

betterAuthComponent.registerRoutes(http, createAuth);

polar.registerRoutes(http);

const cors = corsRouter(http, {
   allowedOrigins: getConvexAppUrls(),
   allowedHeaders: ["Content-Type", "Authorization"],
   allowCredentials: true,
});

cors.route({
   path: "/chat",
   method: "POST",
   handler: chatPOST,
});

cors.route({
   path: "/chat",
   method: "GET",
   handler: chatGET,
});

// File upload route
cors.route({
   path: "/upload",
   method: "POST",
   handler: uploadFile,
});

// Speech-to-text route
cors.route({
   path: "/transcribe",
   method: "POST",
   handler: transcribeAudio,
});

http.route({
   path: "/r2",
   method: "GET",
   handler: getFile,
});

// Resend webhook route for email status updates
http.route({
   path: "/resend-webhook",
   method: "POST",
   handler: httpAction(async (ctx, req) => {
      const event = await req.json();
      await ctx.runMutation(components.resend.lib.handleEmailEvent, { event });
      return new Response("OK", { status: 200 });
   }),
});

// Inline suggestion route
// cors.route({
//    path: "/inline-suggestion",
//    method: "POST",
//    handler: inlineSuggestion,
// });

export default http;
