import { internalMutation } from "./_generated/server";
import { r2 } from "./attachments";

/**
 * Batch delete all trashed documents older than 20 days and their associated files.
 * Intended to be called by a scheduled cron job.
 */
const DAYS_TO_KEEP_TRASHED_DOCUMENTS = 20;

export const deleteOldTrashedDocumentsAndFiles = internalMutation({
   args: {},
   handler: async (ctx) => {
      const now = Date.now();
      const cutoff = now - DAYS_TO_KEEP_TRASHED_DOCUMENTS * 24 * 60 * 60 * 1000; // 20 days in ms
      // Query all trashed documents, then filter by updatedAt
      const oldTrashed = await ctx.db
         .query("documents")
         .filter((q) => q.and(q.eq(q.field("isDeleted"), true), q.lt(q.field("updatedAt"), cutoff)))
         .collect();

      let deletedCount = 0;
      for (const doc of oldTrashed) {
         // If the document has an associated fileUrl (attachment key), delete the file from storage
         if (doc.fileUrl) {
            try {
               await r2.deleteObject(ctx, doc.fileUrl);
            } catch (e) {
               // Log and continue
               console.warn("Failed to delete fileUrl for doc", doc._id, doc.fileUrl, e);
            }
         }
         await ctx.db.delete(doc._id);
         deletedCount++;
      }
      return { deleted: deletedCount };
   },
});
