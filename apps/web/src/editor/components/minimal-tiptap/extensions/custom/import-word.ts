import { Extension } from "@tiptap/react";
import type { default as Mammoth } from "mammoth";

export interface ImportWordOptions {
   /** Function for converting Word files to HTML */
   convert?: (file: File) => Promise<string>;

   /** Function for uploading images */
   upload?: (files: File[]) => Promise<unknown>;

   /**
    * File Size limit(10 MB)
    *
    * @default 1024 * 1024 * 10
    */
   limit?: number;
   mammothOptions?: Parameters<(typeof Mammoth)["convertToHtml"]>[1];
}

export const ImportWord = Extension.create<ImportWordOptions>({
   name: "importWord",
   addOptions() {
      return {
         ...this.parent?.(),
         upload: undefined,
         convert: undefined,
         limit: 1024 * 1024 * 10, // 10 MB
      };
   },
   // You can add commands here if you want to provide import logic as a command
});
