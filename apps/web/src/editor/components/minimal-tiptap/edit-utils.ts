export interface BlockBasedState {
   id: string;
   type: string;
   content: string;
   range: { from: number; to: number };
}
/**
 * Formats block-based state for AI context.
 * Example output:
 * [block-0] paragraph:
 * <html>
 */
export function formatBlockBasedStateForAI(blocks: BlockBasedState[]): string {
   return blocks
      .map(
         (block) =>
            `[${block.id}] ${block.type}:
${block.content}
`
      )
      .join("\n");
}

import type { Editor } from "@tiptap/react";
/**
 * Applies a batch of block edits (replace, insert, remove) to the editor using confirmBlockChange nodes.
 * Sorts edits to avoid position shift issues. Returns true if any edits were applied.
 *
 * @param editor The Tiptap editor instance
 * @param blockEdits Array of block edit objects ({id, content, editType, placement})
 * @param blocks Current block-based state (from getBlockBasedState)
 * @param afterApply Optional callback after all edits
 * @returns boolean - true if any edits were applied
 */
import { isValidConfirmBlockChange } from "./extensions/confirm-block-change";
import z from "zod";
import { DOMSerializer } from "@tiptap/pm/model";

// Define the base enums
const editTypeEnum = z.enum(["insert", "replace", "remove"]);
const placementEnum = z.enum(["in_place", "after_block", "before_block"]);

// Export TypeScript types for the enums
export type EditType = z.infer<typeof editTypeEnum>;
export type Placement = z.infer<typeof placementEnum>;

// Export the base types for the edit structure
export type EditRange = {
   from: number;
   to: number;
};

export type BlockRange = {
   fromBlock: string;
   toBlock: string;
};

export type Edit = {
   editType: EditType;
   range: EditRange;
   placement: Placement;
   blockRange?: BlockRange;
};

export type BlockEditResponse = {
   edit: Edit;
};
export type EditWithContent = Edit & { content: string; id: string; updateId?: string };

export interface BlockEdit {
   id: string;
   content: string;
   editType: "replace" | "insert" | "remove";
   placement: "in_place" | "after_block" | "before_block";
}

export function applyBlockEditsToEditor(
   editor: Editor,
   blockEdits: BlockEdit[],
   blocks: BlockBasedState[],
   afterApply?: () => void
): boolean {
   if (!editor || !blockEdits || !blocks) return false;
   // Sort edits by block.range.from descending to avoid position shift issues
   const indexedEdits = blockEdits.map((edit, i) => ({ edit, idx: i }));
   const sortedEdits = indexedEdits.sort((a, b) => {
      const aFrom = blocks[a.idx]?.range.from ?? 0;
      const bFrom = blocks[b.idx]?.range.from ?? 0;
      return bFrom - aFrom;
   });
   let currentBlocks = blocks;
   let applied = false;
   sortedEdits.forEach(({ edit, idx }) => {
      const block = currentBlocks[idx];
      let pos = block?.range.from ?? 0;
      if (edit.editType === "insert") {
         if (!isValidConfirmBlockChange({ originalContent: "", newContent: edit.content, changeType: "insert" })) return;
         if (edit.placement === "after_block" && block) pos = block.range.to;
         else if (edit.placement === "before_block" && block) pos = block.range.from;
         editor
            .chain()
            .focus()
            .insertContentAt(pos, {
               type: "confirmBlockChange",
               attrs: {
                  changeType: edit.editType,
                  originalContent: "",
                  newContent: edit.content,
                  blockId: block?.id,
               },
            })
            .run();
         applied = true;
      } else if (edit.editType === "replace") {
         if (!isValidConfirmBlockChange({ originalContent: block?.content ?? "", newContent: edit.content, changeType: "replace" }))
            return;
         editor
            .chain()
            .focus()
            .deleteRange({ from: block?.range.from ?? 0, to: block?.range.to ?? 0 })
            .insertContentAt(block?.range.from ?? 0, {
               type: "confirmBlockChange",
               attrs: {
                  changeType: edit.editType,
                  originalContent: block?.content ?? "",
                  newContent: edit.content,
                  blockId: block?.id,
               },
            })
            .run();
         applied = true;
      } else if (edit.editType === "remove") {
         if (!isValidConfirmBlockChange({ originalContent: block?.content ?? "", newContent: "", changeType: "remove" })) return;
         editor
            .chain()
            .focus()
            .deleteRange({ from: block?.range.from ?? 0, to: block?.range.to ?? 0 })
            .insertContentAt(block?.range.from ?? 0, {
               type: "confirmBlockChange",
               attrs: {
                  changeType: edit.editType,
                  originalContent: block?.content ?? "",
                  newContent: "",
                  blockId: block?.id,
               },
            })
            .run();
         applied = true;
      }
      // After each mutation, recompute blocks to get fresh positions
      currentBlocks = getBlockBasedState(editor);
   });
   if (applied && afterApply) afterApply();
   return applied;
}

/**
 * Gets the block-based state of the editor.
 * Optimized for performance with large documents by:
 * 1. Using a single DOM element for serialization
 * 2. Minimizing DOM operations
 * 3. Using efficient node traversal
 * 4. Implementing early returns
 */
export function getBlockBasedState(editor: Editor): BlockBasedState[] {
   if (!editor?.state?.doc) return [];

   const blocks: BlockBasedState[] = [];
   let blockIndex = 0;
   const doc = editor.state.doc;

   // Create a single reusable div for serialization
   const div = document.createElement("div");
   const serializer = DOMSerializer.fromSchema(editor.state.schema);

   try {
      // Use efficient node traversal
      doc.descendants((node, pos, parent) => {
         // Skip non-block nodes or non-direct children
         if (parent !== doc || !node.isBlock) return true;

         try {
            // Skip confirmBlockChange nodes to prevent nesting
            if (node.type.name === "confirmBlockChange") return true;

            // Serialize node directly without creating intermediate elements
            const fragment = serializer.serializeNode(node);
            div.innerHTML = "";
            div.appendChild(fragment);

            // Decode HTML entities once and clean up
            const html = div.innerHTML
               .replace(/&amp;/g, "&")
               .replace(/&lt;/g, "<")
               .replace(/&gt;/g, ">")
               .replace(/&quot;/g, '"')
               .replace(/<confirm-block-change[^>]*>.*?<\/confirm-block-change>/g, "") // Remove any nested confirm blocks
               .replace(/\s+/g, " ") // Normalize whitespace
               .trim();

            // Only add block if it has content
            if (html) {
               blocks.push({
                  id: `block-${blockIndex++}`,
                  type: node.type.name,
                  content: html,
                  range: {
                     from: pos,
                     to: pos + node.nodeSize,
                  },
               });
            }
         } catch (error) {
            console.error("Error processing block:", error);
         }

         return true;
      });
   } catch (error) {
      console.error("Error traversing document:", error);
   } finally {
      // Clean up DOM elements
      div.remove();
   }

   return blocks;
}

/**
 * Cleans up HTML by removing inline styles and normalizing attributes
 */
/**
 * Cleans up HTML by removing inline styles and normalizing attributes
 */
function cleanBlockHtml(html: string): string {
   // Create a temporary DOM element to parse the HTML
   const tempDiv = document.createElement("div");
   tempDiv.innerHTML = html;

   // Function to clean up a single element
   const cleanElement = (element: Element) => {
      // Remove style and class attributes
      element.removeAttribute("style");
      element.removeAttribute("class");

      // Clean up specific elements
      if (element.tagName === "TD" || element.tagName === "TH") {
         // Keep only essential attributes for table cells
         const attrs = element.attributes;
         for (let i = attrs.length - 1; i >= 0; i--) {
            const attr = attrs[i];
            if (attr && !["colspan", "rowspan"].includes(attr.name)) {
               element.removeAttribute(attr.name);
            }
         }
      }

      // Recursively clean child elements
      Array.from(element.children).forEach(cleanElement);
   };

   // Clean all elements in the document
   Array.from(tempDiv.children).forEach(cleanElement);

   return tempDiv.innerHTML;
}
