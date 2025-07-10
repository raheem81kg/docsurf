"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";

export const processPdf = internalAction({
   args: {
      pdfBuffer: v.bytes(),
   },
   handler: async (ctx, { pdfBuffer }) => {
      try {
         // Import the estimatePdf function in Node.js runtime
         const { estimatePdf } = await import("@docsurf/utils/pdf_estimate");

         // pdfBuffer is already an ArrayBuffer, use it directly
         const result = await estimatePdf(pdfBuffer);

         return result;
      } catch (error) {
         console.error("Error processing PDF in Node.js runtime:", error);
         throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
   },
});
