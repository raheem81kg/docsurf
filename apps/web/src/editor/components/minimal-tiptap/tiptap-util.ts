import type { Attrs, Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_CHARACTERS = 250000;
/** Default number of rows and columns for grids when creating a table */
export const TABLE_INIT_GRID_SIZE = 10;
/** Maximum number of rows and columns for grids when creating a table */
export const TABLE_MAX_GRID_SIZE = 10;
/** Minimum number of rows and columns for grids when creating a table */
export const TABLE_DEFAULT_SELECTED_GRID_SIZE = 2;

/**
 * Checks if a mark exists in the editor schema
 * @param markName - The name of the mark to check
 * @param editor - The editor instance
 * @returns boolean indicating if the mark exists in the schema
 */
export const isMarkInSchema = (markName: string, editor: Editor | null): boolean => {
   if (!editor?.schema) return false;
   return editor.schema.spec.marks.get(markName) !== undefined;
};

/**
 * Checks if a node exists in the editor schema
 * @param nodeName - The name of the node to check
 * @param editor - The editor instance
 * @returns boolean indicating if the node exists in the schema
 */
export const isNodeInSchema = (nodeName: string, editor: Editor | null): boolean => {
   if (!editor?.schema) return false;
   return editor.schema.spec.nodes.get(nodeName) !== undefined;
};

/**
 * Gets the active attributes of a specific mark in the current editor selection.
 *
 * @param editor - The Tiptap editor instance.
 * @param markName - The name of the mark to look for (e.g., "highlight", "link").
 * @returns The attributes of the active mark, or `null` if the mark is not active.
 */
export function getActiveMarkAttrs(editor: Editor | null, markName: string): Attrs | null {
   if (!editor) return null;
   const { state } = editor;
   const marks = state.storedMarks || state.selection.$from.marks();
   const mark = marks.find((mark) => mark.type.name === markName);

   return mark?.attrs ?? null;
}

/**
 * Checks if a node is empty
 */
export function isEmptyNode(node?: Node | null): boolean {
   return !!node && node.content.size === 0;
}

/**
 * Finds the position and instance of a node in the document
 * @param props Object containing editor, node (optional), and nodePos (optional)
 * @param props.editor The TipTap editor instance
 * @param props.node The node to find (optional if nodePos is provided)
 * @param props.nodePos The position of the node to find (optional if node is provided)
 * @returns An object with the position and node, or null if not found
 */
export function findNodePosition(props: {
   editor: Editor | null;
   node?: Node | null;
   nodePos?: number | null;
}): { pos: number; node: Node } | null {
   const { editor, node, nodePos } = props;

   if (!editor || !editor.state?.doc) return null;

   // Zero is valid position
   const hasValidNode = node !== undefined && node !== null;
   const hasValidPos = nodePos !== undefined && nodePos !== null;

   if (!hasValidNode && !hasValidPos) {
      return null;
   }

   if (hasValidPos) {
      try {
         const nodeAtPos = editor.state.doc.nodeAt(nodePos!);
         if (nodeAtPos) {
            return { pos: nodePos!, node: nodeAtPos };
         }
      } catch (error) {
         console.error("Error checking node at position:", error);
         return null;
      }
   }

   // Otherwise search for the node in the document
   let foundPos = -1;
   let foundNode: Node | null = null;

   editor.state.doc.descendants((currentNode, pos) => {
      // TODO: Needed?
      // if (currentNode.type && currentNode.type.name === node!.type.name) {
      if (currentNode === node) {
         foundPos = pos;
         foundNode = currentNode;
         return false;
      }
      return true;
   });

   return foundPos !== -1 && foundNode !== null ? { pos: foundPos, node: foundNode } : null;
}

/**
 * Handles image upload with progress tracking and abort capability
 * @param file The file to upload
 * @param onProgress Optional callback for tracking upload progress
 * @param abortSignal Optional AbortSignal for cancelling the upload
 * @returns Promise resolving to the URL of the uploaded image
 */
export const handleImageUpload = async (
   file: File,
   onProgress?: (event: { progress: number }) => void,
   abortSignal?: AbortSignal
): Promise<string> => {
   // Validate file
   if (!file) {
      throw new Error("No file provided");
   }

   if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
   }

   // For demo/testing: Simulate upload progress
   for (let progress = 0; progress <= 100; progress += 10) {
      if (abortSignal?.aborted) {
         throw new Error("Upload cancelled");
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      onProgress?.({ progress });
   }

   return "/images/placeholder-image.png";

   // Uncomment for production use:
   // return convertFileToBase64(file, abortSignal);
};

/**
 * Converts a File to base64 string
 * @param file The file to convert
 * @param abortSignal Optional AbortSignal for cancelling the conversion
 * @returns Promise resolving to the base64 representation of the file
 */
export const convertFileToBase64 = (file: File, abortSignal?: AbortSignal): Promise<string> => {
   if (!file) {
      return Promise.reject(new Error("No file provided"));
   }

   return new Promise((resolve, reject) => {
      const reader = new FileReader();

      const abortHandler = () => {
         reader.abort();
         reject(new Error("Upload cancelled"));
      };

      if (abortSignal) {
         abortSignal.addEventListener("abort", abortHandler);
      }

      reader.onloadend = () => {
         if (abortSignal) {
            abortSignal.removeEventListener("abort", abortHandler);
         }

         if (typeof reader.result === "string") {
            resolve(reader.result);
         } else {
            reject(new Error("Failed to convert File to base64"));
         }
      };

      reader.onerror = (error) => reject(new Error(`File reading error: ${error}`));
      reader.readAsDataURL(file);
   });
};

const isBrowser = typeof window !== "undefined";

export function downloadFromBlob(blob: Blob, filename: string) {
   if (isBrowser) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      return Promise.resolve();
   }

   console.error("Download is not supported in Node.js");

   return Promise.resolve();
}

/**
 * Checks if the editor has a specific extension method with the given name.
 *
 * @param {Editor} editor - An instance of the editor.
 * @param {string} name - The name of the extension method.
 * @returns {boolean} - Returns true if the specified extension method is present, otherwise returns false.
 */
export function hasExtension(editor: Editor, name: string): boolean {
   if (!editor) {
      return false;
   }

   // Retrieve the extension manager of the editor, defaulting to an empty array if it doesn't exist
   const { extensions = [] } = editor?.extensionManager ?? {};

   // Check if the extension method with the specified name is present in the extension manager
   const find = extensions.find((i) => i.name === name);

   // Return false if the extension method with the specified name is not found, otherwise return true
   if (!find) {
      return false;
   }
   return true;
}

// =====================
// Content Comparison Utilities
// =====================

/**
 * Recursively normalize content for comparison by removing non-essential fields.
 * Only keeps type, content, and text fields.
 */
export function normalizeContentForComparison(node: any): any {
   if (Array.isArray(node)) {
      return node.map(normalizeContentForComparison);
   }
   if (node && typeof node === "object") {
      // Only keep essential fields: type, content, text
      const { type, content, text } = node;
      const normalized: any = { type };
      if (content) normalized.content = normalizeContentForComparison(content);
      if (text) normalized.text = text;
      return normalized;
   }
   return node;
}

/**
 * Helper to extract comparable content (e.g., only the 'content' array, normalized)
 */
export function getComparableContent(content: any) {
   if (content && typeof content === "object" && "content" in content) {
      return normalizeContentForComparison(content.content);
   }
   return content;
}
