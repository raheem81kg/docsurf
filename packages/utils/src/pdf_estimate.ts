import { estimateTokenCount } from "@docsurf/utils/constants/file_constants";
import { extractText, getDocumentProxy } from "unpdf";

export const estimatePdf = async (pdfBuffer: ArrayBuffer) => {
   try {
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdf = await getDocumentProxy(uint8Array);
      const { totalPages, text } = await extractText(pdf, {
         mergePages: true,
      });
      return {
         tokenCount: estimateTokenCount(text),
         pageCount: totalPages,
      };
   } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from PDF");
   }
};
