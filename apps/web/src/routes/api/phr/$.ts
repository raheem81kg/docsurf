import { createServerFileRoute } from "@tanstack/react-start/server";

const POSTHOG_HOST = process.env.VITE_POSTHOG_HOST;

function filterHeaders(headers: Headers): Record<string, string> {
   const filtered: Record<string, string> = {};
   for (const [key, value] of headers.entries()) {
      // Filter out headers that might cause issues when proxying
      if (key.toLowerCase() !== "host") {
         filtered[key] = value;
      }
   }
   return filtered;
}

export const ServerRoute = createServerFileRoute("/api/phr/$").methods({
   GET: async ({ params, request }) => {
      const url = new URL(request.url);
      const targetUrl = `${POSTHOG_HOST}${url.pathname.replace("/api/phr", "")}${url.search}`;

      const response = await fetch(targetUrl, {
         method: "GET",
         headers: filterHeaders(request.headers),
      });

      // Read the response body as ArrayBuffer to properly handle binary/compressed data
      const body = await response.arrayBuffer();

      // Filter out headers that might be incorrect after decompression
      const responseHeaders = Object.fromEntries(
         Array.from(response.headers.entries()).filter(
            ([key]) => key.toLowerCase() !== "content-length" && key.toLowerCase() !== "content-encoding"
         )
      );

      return new Response(body, {
         status: response.status,
         statusText: response.statusText,
         headers: {
            ...responseHeaders,
            // Ensure CORS headers are preserved
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
            "Access-Control-Allow-Credentials": "true",
         },
      });
   },
   POST: async ({ params, request }) => {
      const url = new URL(request.url);
      const targetUrl = `${POSTHOG_HOST}${url.pathname.replace("/api/phr", "")}${url.search}`;

      // Get the request body as an ArrayBuffer to preserve binary data
      const body = await request.arrayBuffer();

      const response = await fetch(targetUrl, {
         method: "POST",
         headers: filterHeaders(request.headers),
         body: body,
         // Note: duplex is not needed when using ArrayBuffer
      });

      // Read the response body to handle potential compression
      const responseBody = await response.arrayBuffer();

      // Filter out headers that might be incorrect after decompression
      const responseHeaders = Object.fromEntries(
         Array.from(response.headers.entries()).filter(
            ([key]) => key.toLowerCase() !== "content-length" && key.toLowerCase() !== "content-encoding"
         )
      );

      return new Response(responseBody, {
         status: response.status,
         statusText: response.statusText,
         headers: {
            ...responseHeaders,
            // Ensure CORS headers are preserved
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
            "Access-Control-Allow-Credentials": "true",
         },
      });
   },
   OPTIONS: async ({ params, request }) => {
      const url = new URL(request.url);
      const targetUrl = `${POSTHOG_HOST}${url.pathname.replace("/api/phr", "")}${url.search}`;

      const response = await fetch(targetUrl, {
         method: "OPTIONS",
         headers: filterHeaders(request.headers),
      });

      const responseBody = await response.arrayBuffer();

      // Filter out headers that might be incorrect
      const responseHeaders = Object.fromEntries(
         Array.from(response.headers.entries()).filter(
            ([key]) => key.toLowerCase() !== "content-length" && key.toLowerCase() !== "content-encoding"
         )
      );

      return new Response(responseBody, {
         status: response.status,
         statusText: response.statusText,
         headers: {
            ...responseHeaders,
            // Ensure CORS headers are preserved
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Accept-Language, Content-Encoding",
         },
      });
   },
});
