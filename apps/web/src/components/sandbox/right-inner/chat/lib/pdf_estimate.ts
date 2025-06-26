import { estimateTokenCount } from "@docsurf/utils/constants/file_constants";
import { definePDFJSModule, extractText, getDocumentProxy } from "unpdf";

export const estimatePdf = async (pdfBuffer: ArrayBuffer) => {
   const imported = await import("../pdfjs_dist/pdfjs.mjs");
   console.log("imported", imported);
   await definePDFJSModule(async () => imported);
   try {
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdf = await getDocumentProxy(uint8Array);
      const { text, totalPages } = await extractText(pdf, { mergePages: true });
      return {
         tokenCount: estimateTokenCount(text),
         pageCount: totalPages,
      };
   } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from PDF");
   }
};
