import { generateHTML } from "@tiptap/html";
import { getServerTiptapExtensions } from "./server-extensions";
import type { JSONContent } from "@tiptap/core";

function isBrowser() {
   return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Render a document's Tiptap JSON content as HTML using the server extension set.
 * Returns null if content is missing or invalid.
 * This function is now async because it may dynamically import DOMPurify in the browser.
 */
export async function getDocumentHtml(content: string): Promise<string | null> {
   if (!content) return null;
   const originalJson = safeParseTiptapContent(content);
   if (originalJson) {
      try {
         let html = generateHTML(originalJson, getServerTiptapExtensions());
         console.log("[DEBUG] html:", html);
         // Replace all base64-encoded data URLs (images, audio, video, pdf, etc.) with a placeholder
         html = html.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, "[base64 omitted]");
         // Replace all blob: URLs with a placeholder
         html = html.replace(/blob:[^"'\s)]+/g, "[blob omitted]");
         // Sanitize HTML to prevent XSS and other issues (browser only)
         if (isBrowser()) {
            // Dynamically import DOMPurify only in the browser
            const DOMPurify = await import("isomorphic-dompurify");
            html = DOMPurify.default.sanitize(html, { USE_PROFILES: { html: true } });
         }
         return html;
      } catch (error) {
         console.log("[DEBUG] error:", error);
         console.log("[DEBUG] catch error");
         return null;
      }
   }
   console.log("[DEBUG] outside null 2");
   return null;
}

/**
 * Safely parse Tiptap JSON content.
 * Returns null if invalid or malformed.
 */
export function safeParseTiptapContent(content: unknown): JSONContent | null {
   try {
      const parsed = parseTiptapContent(content);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
         return parsed as JSONContent;
      }
      return null;
   } catch {
      return null;
   }
}

/**
 * Ensures the input is a valid Tiptap JSON object.
 * Accepts a stringified JSON or an object.
 * Returns null if invalid or empty.
 */
export function parseTiptapContent(content: unknown): object | null {
   if (!content || typeof content === "number" || typeof content === "boolean") return null;
   if (typeof content === "object") {
      if (Array.isArray(content)) return null;
      return content;
   }
   if (typeof content === "string") {
      try {
         const parsed = JSON.parse(content);
         if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
         }
         return null;
      } catch {
         return null;
      }
   }
   return null;
}
