import { internalMutation } from "./_generated/server";

// export const clearDangling = internalMutation({
//    handler: async (ctx) => {
//       const files = await ctx.db
//          .query("files")
//          .withIndex("by_message", (q) => q.eq("messageId", undefined))
//          .collect();
//       for (const file of files) {
//          await ctx.db.delete(file._id);
//          await r2.deleteObject(ctx, file.key);
//       }
//    },
// });
