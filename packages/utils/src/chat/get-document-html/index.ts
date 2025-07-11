import { generateHTML } from "@tiptap/html";
import { getServerTiptapExtensions } from "./server-extensions";
import type { JSONContent } from "@tiptap/core";

function isBrowser() {
   return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Render a document's Tiptap JSON content as HTML using the server extension set.
 * Returns null if content is missing or invalid.
 */
export function getDocumentHtml(content: string): string | null {
   if (!content) return null;
   const originalJson = safeParseTiptapContent(content);
   if (originalJson) {
      try {
         let html = generateHTML(originalJson, getServerTiptapExtensions());
         // Replace all base64-encoded data URLs (images, audio, video, pdf, etc.) with a placeholder
         html = html.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, "[base64 omitted]");
         // Replace all blob: URLs with a placeholder
         html = html.replace(/blob:[^"'\s)]+/g, "[blob omitted]");
         // Sanitize HTML to prevent XSS and other issues (browser only)
         if (isBrowser()) {
            // @ts-ignore
            // This ensures isomorphic-dompurify is only loaded in environments where window exists. (CRITICAL)
            const DOMPurify = require("isomorphic-dompurify");
            html = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
         }
         return html;
      } catch {
         return null;
      }
   }
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
