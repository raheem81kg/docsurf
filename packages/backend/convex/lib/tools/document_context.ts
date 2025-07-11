import { tool } from "ai";
import { getDocumentHtml } from "@docsurf/utils/chat/get-document-html/index";
import type { ToolAdapter } from "../toolkit";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { z } from "zod";

export const DocumentContextAdapter: ToolAdapter = async ({ ctx, enabledTools, toolRequestContext }) => {
   if (!enabledTools.includes("document_context")) return {};

   return {
      get_current_document: tool({
         description: "Get the current document's content as HTML and its metadata.",
         parameters: z.object({}),
         execute: async () => {
            const doc = await ctx.runQuery(internal.documents.getDocumentById, {
               id: toolRequestContext.currentDocumentId as Id<"documents">,
            });
            if (!doc) {
               return {
                  success: false,
                  error: "Document not found or access denied.",
                  html: null,
                  metadata: null,
               };
            }
            if (!doc.content) {
               return {
                  success: false,
                  error: "Document content is empty.",
                  html: null,
                  metadata: null,
               };
            }
            const html = getDocumentHtml(doc.content);
            return {
               success: true,
               html,
               metadata: {
                  id: doc._id,
                  title: doc.title,
                  documentType: doc.documentType,
                  description: doc.description,
                  updatedAt: doc.updatedAt,
                  isLocked: doc.isLocked,
                  isPublic: doc.isPublic,
                  writingStyle: doc.writingStyle,
                  customPrompt: doc.customPrompt,
                  defaultModel: doc.defaultModel,
               },
            };
         },
      }),
   };
};
