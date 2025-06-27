/**
 * Edit application utilities for TipTap editor
 * Handles the application of edits with confirmation blocks
 */

import type { Editor } from "@tiptap/react";
import type { BlockBasedState, EditWithContent } from "../edit-utils";

/**
 * Validates an edit operation and its associated blocks
 */
function validateEditOperation(edit: EditWithContent, blocks: BlockBasedState[]): boolean {
   if (!edit || !blocks?.length) return false;

   // Validate edit type
   if (!["insert", "replace", "remove"].includes(edit.editType)) return false;

   // Validate content for insert/replace
   if ((edit.editType === "insert" || edit.editType === "replace") && !edit.content) return false;

   // Validate block range if present
   if (edit.blockRange) {
      const { fromBlock, toBlock } = edit.blockRange;
      if (fromBlock && !blocks.some((b) => b.id === fromBlock)) return false;
      if (toBlock && !blocks.some((b) => b.id === toBlock)) return false;
   }

   return true;
}

/**
 * Finds a block by its ID or range
 */
function findBlock(edit: EditWithContent, blocks: BlockBasedState[]): BlockBasedState | undefined {
   if (edit.blockRange?.fromBlock) {
      return blocks.find((b) => b.id === edit.blockRange!.fromBlock);
   }
   return blocks.find((b) => b.range.from === edit.range.from && b.range.to === edit.range.to);
}

/**
 * Gets the insertion position based on edit type and placement
 */
function getInsertPosition(edit: EditWithContent, blocks: BlockBasedState[]): number {
   if (edit.editType !== "insert") return edit.range.from;

   if (edit.placement === "after_block" && edit.blockRange?.toBlock) {
      const afterBlock = blocks.find((b) => b.id === edit.blockRange!.toBlock);
      return afterBlock?.range.to ?? edit.range.from;
   }

   if (edit.placement === "before_block" && edit.blockRange?.fromBlock) {
      const beforeBlock = blocks.find((b) => b.id === edit.blockRange!.fromBlock);
      return beforeBlock?.range.from ?? edit.range.from;
   }

   return edit.range.from;
}

/**
 * Creates a confirmBlockChange node with the given attributes
 */
function createConfirmBlockNode(edit: EditWithContent, block: BlockBasedState | undefined) {
   return {
      type: "confirmBlockChange",
      attrs: {
         changeType: edit.editType,
         originalContent: block?.content || "",
         newContent: edit.content,
         blockId: edit.id,
         updateId: edit.updateId,
      },
   };
}

/**
 * Applies a single edit to the editor with confirmation
 * @param editor - The TipTap editor instance
 * @param edit - The edit to apply
 * @param blocks - The current blocks in the editor
 * @param afterApply - Optional callback to run after successful application
 * @returns boolean indicating if the edit was applied successfully
 */
export function applySingleEditToEditor(
   editor: Editor,
   edit: EditWithContent,
   blocks: BlockBasedState[],
   afterApply?: () => void
): boolean {
   // Validate inputs
   if (!editor?.isActive || !validateEditOperation(edit, blocks)) {
      return false;
   }

   try {
      const contentLength = editor.state.doc.content.size;
      const block = findBlock(edit, blocks);
      const pos = getInsertPosition(edit, blocks);

      // Ensure range is within bounds
      const from = Math.min(edit.range.from, contentLength);
      const to = Math.min(edit.range.to, contentLength);

      // Handle different edit types
      switch (edit.editType) {
         case "insert":
            editor.chain().focus().insertContentAt(pos, createConfirmBlockNode(edit, block)).run();
            break;

         case "replace":
         case "remove":
            if (from >= to) return false;

            editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, createConfirmBlockNode(edit, block)).run();
            break;
      }

      afterApply?.();
      return true;
   } catch (error) {
      console.error("Failed to apply edit:", error);
      return false;
   }
}
