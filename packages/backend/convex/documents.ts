// documents.ts
// Convex functions for document tree operations: batch upsert, batch delete, and tree fetch.
// Mirrors Supabase logic for document reordering, deletion, and tree retrieval.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { Documents } from "./schema/documents";
import type { Infer } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireWorkspacePermission } from "./lib/identity";
import { r2 } from "./attachments";
import { rateLimiter } from "./rateLimiter";
type DocumentType = Infer<typeof Documents>["documentType"];

/**
 * Batch upsert documents: update parentUuid, orderPosition, etc.
 * Accepts an array of updates. Upserts if exists, inserts if not.
 *
 * @param workspaceId The workspace to scope the operation to
 * @param updates Array of document updates (parentUuid, orderPosition, documentType, updatedAt)
 * @returns Success/failure result
 */
export const batchUpsertDocuments = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      updates: v.array(
         v.object({
            id: v.id("documents"),
            parentId: v.optional(v.id("documents")),
            orderPosition: v.optional(v.number()),
            documentType: v.union(
               v.literal("folder"),
               v.literal("text/plain"),
               // v.literal("video/mp4"),
               // v.literal("audio/mp3"),
               v.literal("application/pdf")
               // v.literal("application/octet-stream"),
               // v.literal("website")
            ),
            updatedAt: v.number(),
            isDeleted: v.optional(v.boolean()),
            depth: v.number(),
            isCollapsed: v.optional(v.boolean()),
         })
      ),
   },
   handler: async (ctx, { workspaceId, updates }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      let successCount = 0;
      for (const update of updates) {
         // Find by id
         const existing = await ctx.db.get(update.id);
         if (existing && existing.authorId === userId && existing.workspaceId === workspaceId) {
            await ctx.db.patch(existing._id, {
               parentId: update.parentId,
               orderPosition: update.orderPosition,
               documentType: update.documentType as DocumentType,
               updatedAt: update.updatedAt,
               isDeleted: update.isDeleted ?? existing.isDeleted,
               depth: update.depth,
               isCollapsed: typeof update.isCollapsed === "boolean" ? update.isCollapsed : existing.isCollapsed,
            });
            successCount++;
         }
         // If not found, do nothing (do not insert new documents)
      }
      return { success: true, count: successCount };
   },
});

/**
 * Batch delete documents: mark isDeleted true and parentUuid undefined for all given document ids.
 *
 * @param workspaceId The workspace to scope the operation to
 * @param ids Array of document Convex Ids to delete
 * @returns Success/failure result
 */
export const batchTrashDocuments = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      ids: v.array(v.id("documents")),
   },
   handler: async (ctx, { workspaceId, ids }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      let successCount = 0;
      // Recursive helper to mark a document and all its descendants as deleted
      const recursiveTrash = async (docId: Id<"documents">) => {
         await ctx.db.patch(docId, {
            isDeleted: true,
            parentId: undefined,
         });
         const children = await ctx.db
            .query("documents")
            .withIndex("byParentId", (q) => q.eq("parentId", docId))
            .filter((q) =>
               q.and(
                  q.eq(q.field("authorId"), userId as Id<"users">),
                  q.eq(q.field("workspaceId"), workspaceId),
                  q.or(q.eq(q.field("isDeleted"), false), q.eq(q.field("isDeleted"), undefined), q.eq(q.field("isDeleted"), null))
               )
            )
            .collect();
         for (const child of children) {
            await recursiveTrash(child._id);
         }
      };
      for (const id of ids) {
         const existing = await ctx.db.get(id);
         if (existing && existing.authorId === userId && existing.workspaceId === workspaceId) {
            await recursiveTrash(id);
            successCount++;
         }
      }
      return { success: true, count: successCount };
   },
});

/**
 * Fetch the document tree: top-level documents (parentUuid undefined, not deleted), ordered by orderPosition.
 *
 * @param workspaceId The workspace to scope the operation to
 * @param limit Optional limit argument
 * @param documentType Optional document type filter
 * @returns Array of document tree nodes
 */
export const fetchDocumentTree = query({
   args: {
      workspaceId: v.id("workspaces"),
      limit: v.optional(v.number()),
      documentType: v.optional(
         v.union(
            v.literal("folder"),
            v.literal("text/plain"),
            v.literal("video/mp4"),
            v.literal("audio/mp3"),
            v.literal("application/pdf"),
            v.literal("application/octet-stream"),
            v.literal("website")
         )
      ),
   },
   handler: async (ctx, { workspaceId, limit, documentType }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      // Use the new compound index for efficient filtering
      const max = typeof limit === "number" && limit > 0 ? limit : 200;
      let queryBuilder = ctx.db
         .query("documents")
         .withIndex("byUserWorkspaceDeleted", (q) => q.eq("authorId", userId).eq("workspaceId", workspaceId).eq("isDeleted", false));
      if (documentType) {
         queryBuilder = queryBuilder.filter((q) => q.eq(q.field("documentType"), documentType));
      }
      const docs = await queryBuilder.order("asc").take(max);
      docs.sort((a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0));
      return { data: docs };
   },
});

/**
 * Create a new document in the workspace.
 *
 * @param workspaceId The workspace to scope the operation to
 * @param title The document title
 * @param documentType The type of document
 * @param parentId The parent document's id (string, for tree structure)
 * @param fileUrl Optional file URL
 * @param content Optional content
 * @param orderPosition Optional order position
 * @returns The new document's Convex Id and parentUuid
 */
export const createDocument = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      title: v.string(),
      documentType: v.union(
         v.literal("folder"),
         v.literal("text/plain"),
         // v.literal("video/mp4"),
         // v.literal("audio/mp3"),
         v.literal("application/pdf")
         // v.literal("application/octet-stream"),
         // v.literal("website")
      ),
      fileUrl: v.optional(v.string()),
      parentId: v.optional(v.id("documents")),
      content: v.optional(v.any()),
      orderPosition: v.optional(v.number()),
      isCollapsed: v.optional(v.boolean()),
   },
   handler: async (ctx, args) => {
      const { userId } = await requireWorkspacePermission(ctx, args.workspaceId);
      const now = Date.now();
      await rateLimiter.limit(ctx, "createDocument", { key: userId, throws: true });
      const doc = {
         authorId: userId as Id<"users">,
         workspaceId: args.workspaceId,
         parentId: args.parentId,
         title: args.title,
         documentType: args.documentType as DocumentType,
         fileUrl: args.fileUrl,
         content: args.content,
         orderPosition: args.orderPosition ?? 0,
         updatedAt: now,
         isDeleted: false,
         depth: 0,
         isPublic: false,
         isLocked: false,
         isCollapsed: args.documentType === "folder" ? false : undefined,
      };
      // Insert document
      const id = await ctx.db.insert("documents", doc);
      return { id, parentId: args.parentId };
   },
});

/**
 * Update a document by uuid, scoped by workspace and user.
 */
export const updateDocument = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
      updates: v.object({
         title: v.optional(v.string()),
         content: v.optional(v.any()),
         description: v.optional(v.string()),
         suggestion_length: v.optional(v.number()),
         custom_instructions: v.optional(v.string()),
         documentType: v.optional(
            v.union(
               v.literal("folder"),
               v.literal("text/plain"),
               v.literal("application/pdf")
               // v.literal("video/mp4"),
               // v.literal("audio/mp3"),
               // v.literal("application/octet-stream"),
               // v.literal("website")
            )
         ),
         isCollapsed: v.optional(v.boolean()),
      }),
   },
   handler: async (ctx, { workspaceId, id, updates }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const doc = await ctx.db
         .query("documents")
         .withIndex("byUser", (q) => q.eq("authorId", userId))
         .filter((q) => q.and(q.eq(q.field("_id"), id), q.eq(q.field("workspaceId"), workspaceId)))
         .first();
      if (!doc) {
         return { error: "Document not found" };
      }
      await ctx.db.patch(doc._id, { ...updates, updatedAt: Date.now() });
      const updated = await ctx.db.get(doc._id);
      return updated;
   },
});

/**
 * Update document metadata (title, type, file, lock, publish).
 */
export const updateDocumentMetadata = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
      updates: v.object({
         title: v.optional(v.string()),
         documentType: v.optional(
            v.union(
               v.literal("folder"),
               v.literal("text/plain"),
               v.literal("application/pdf")
               // v.literal("video/mp4"),
               // v.literal("audio/mp3"),
               // v.literal("application/octet-stream"),
               // v.literal("website")
            )
         ),
         fileUrl: v.optional(v.string()),
         isLocked: v.optional(v.boolean()),
         isPublic: v.optional(v.boolean()),
      }),
   },
   handler: async (ctx, { workspaceId, id, updates }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const doc = await ctx.db
         .query("documents")
         .withIndex("byUser", (q) => q.eq("authorId", userId))
         .filter((q) => q.and(q.eq(q.field("_id"), id), q.eq(q.field("workspaceId"), workspaceId)))
         .first();
      if (!doc) {
         return { error: "Document not found" };
      }
      await ctx.db.patch(doc._id, { ...updates, updatedAt: Date.now() });
      const updated = await ctx.db.get(doc._id);
      return updated;
   },
});

/**
 * Permanently delete a document and all its descendants (recursive).
 */
export const deleteDocumentPermanently = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
   },
   handler: async (ctx, { workspaceId, id }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const recursiveDelete = async (docId: Id<"documents">) => {
         const children = await ctx.db
            .query("documents")
            .withIndex("byParentId", (q) => q.eq("parentId", docId))
            .filter((q) => q.and(q.eq(q.field("authorId"), userId), q.eq(q.field("workspaceId"), workspaceId)))
            .collect();
         for (const child of children) {
            await recursiveDelete(child._id);
         }
         const doc = await ctx.db.get(docId);
         if (doc?.fileUrl) {
            try {
               await r2.deleteObject(ctx, doc.fileUrl);
            } catch (e) {
               console.warn("Failed to delete fileUrl for doc", doc._id, doc.fileUrl, e);
            }
         }
         await ctx.db.delete(docId);
      };
      const doc = await ctx.db
         .query("documents")
         .withIndex("byUser", (q) => q.eq("authorId", userId))
         .filter((q) => q.and(q.eq(q.field("_id"), id), q.eq(q.field("workspaceId"), workspaceId)))
         .first();
      if (!doc) {
         return { error: "Document not found" };
      }
      await recursiveDelete(doc._id);
      return { success: true };
   },
});

/**
 * Move a document and all descendants to trash (isDeleted: true, parentUuid: undefined).
 */
export const moveDocumentToTrash = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
   },
   handler: async (ctx, { workspaceId, id }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const recursiveTrash = async (docId: Id<"documents">) => {
         await ctx.db.patch(docId, { isDeleted: true, parentId: undefined });
         const children = await ctx.db
            .query("documents")
            .withIndex("byParentId", (q) => q.eq("parentId", docId))
            .filter((q) =>
               q.and(
                  q.eq(q.field("authorId"), userId),
                  q.eq(q.field("workspaceId"), workspaceId),
                  q.or(q.eq(q.field("isDeleted"), false), q.eq(q.field("isDeleted"), undefined), q.eq(q.field("isDeleted"), null))
               )
            )
            .collect();
         for (const child of children) {
            await recursiveTrash(child._id);
         }
      };
      const doc = await ctx.db
         .query("documents")
         .withIndex("byUser", (q) => q.eq("authorId", userId))
         .filter((q) => q.and(q.eq(q.field("_id"), id), q.eq(q.field("workspaceId"), workspaceId)))
         .first();
      if (!doc) {
         return { error: "Document not found" };
      }
      await recursiveTrash(doc._id);
      return { success: true };
   },
});

/**
 * Fetch documents by parent, order, and not deleted.
 */
export const fetchDocuments = query({
   args: {
      workspaceId: v.id("workspaces"),
      parentId: v.optional(v.id("documents")),
      orderBy: v.optional(v.union(v.literal("orderPosition"), v.literal("updatedAt"), v.literal("title"))),
   },
   handler: async (ctx, { workspaceId, parentId, orderBy }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const q = ctx.db
         .query("documents")
         .withIndex("byParentId", (q) => q.eq("parentId", parentId ?? undefined))
         .filter((q) =>
            q.and(
               q.eq(q.field("authorId"), userId),
               q.eq(q.field("workspaceId"), workspaceId),
               q.or(q.eq(q.field("isDeleted"), false), q.eq(q.field("isDeleted"), undefined), q.eq(q.field("isDeleted"), null))
            )
         );
      // Convex .order() only sorts by _creationTime, so sort in JS
      const docs = await q.collect();
      if (orderBy) {
         docs.sort((a, b) => {
            const key = orderBy;
            const aVal = a[key];
            const bVal = b[key];
            if (aVal === bVal) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            return aVal < bVal ? -1 : 1;
         });
      } else {
         docs.sort((a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0));
      }
      return docs;
   },
});

/**
 * Toggle the lock state of a document (isLocked field).
 */
export const toggleDocumentLock = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
   },
   handler: async (ctx, { workspaceId, id }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const doc = await ctx.db
         .query("documents")
         .withIndex("byUser", (q) => q.eq("authorId", userId))
         .filter((q) => q.and(q.eq(q.field("_id"), id), q.eq(q.field("workspaceId"), workspaceId)))
         .first();
      if (!doc) return { error: "Document not found" };
      const newLocked = !doc.isLocked;
      await ctx.db.patch(doc._id, { isLocked: newLocked, updatedAt: Date.now() });
      return { success: true, isLocked: newLocked };
   },
});

/**
 * Fetch trashed documents for a workspace, with search and pagination support.
 * If query is empty, returns recent trashed documents. If query is non-empty, filters by title.
 */
export const fetchTrashedDocuments = query({
   args: {
      workspaceId: v.id("workspaces"),
      query: v.string(),
      paginationOpts: paginationOptsValidator,
   },
   handler: async (ctx, { workspaceId, query, paginationOpts }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      if (!query.trim()) {
         return await ctx.db
            .query("documents")
            .withIndex("byWorkspaceDeleted", (q) => q.eq("workspaceId", workspaceId).eq("isDeleted", true))
            .filter((q) => q.eq(q.field("authorId"), userId))
            .order("desc")
            .paginate(paginationOpts);
      }
      return await ctx.db
         .query("documents")
         .withIndex("byWorkspaceDeleted", (q) => q.eq("workspaceId", workspaceId).eq("isDeleted", true))
         .filter((q) => q.and(q.eq(q.field("authorId"), userId), q.eq(q.field("title"), query)))
         .order("desc")
         .paginate(paginationOpts);
   },
});

/**
 * Restore a trashed document: set isDeleted to false and parentUuid to undefined (root).
 * @param workspaceId The workspace to scope the operation to
 * @param documentId The document Convex Id to restore
 * @returns Success/failure result
 */
export const restoreDocument = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      documentId: v.id("documents"),
   },
   handler: async (ctx, { workspaceId, documentId }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const doc = await ctx.db
         .query("documents")
         .withIndex("byUser", (q) => q.eq("authorId", userId))
         .filter((q) => q.and(q.eq(q.field("_id"), documentId), q.eq(q.field("workspaceId"), workspaceId)))
         .first();
      if (!doc) {
         return { success: false, error: "Not found or unauthorized" };
      }
      await ctx.db.patch(documentId, {
         isDeleted: false,
         parentId: undefined,
      });
      return { success: true };
   },
});

/**
 * Fetch a single document by its Convex _id, scoped by workspace and user.
 */
export const fetchDocumentById = query({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
   },
   handler: async (ctx, { workspaceId, id }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const doc = await ctx.db.get(id);
      if (!doc || doc.workspaceId !== workspaceId || doc.authorId !== userId) return null;
      return doc;
   },
});

/**
 * Rename a document by id, with validation and authorization.
 */
export const renameDocument = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
      title: v.string(),
   },
   handler: async (ctx, { workspaceId, id, title }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      // Get the document
      const doc = await ctx.db.get(id);
      if (!doc) return { error: "Document not found" };
      // Validate user is the owner and document is in the workspace
      if (doc.authorId !== userId || doc.workspaceId !== workspaceId) {
         return { error: "Unauthorized" };
      }
      // Validate title is not empty and reasonable length
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return { error: "Title cannot be empty" };
      if (trimmedTitle.length > 100) return { error: "Title too long" };
      await ctx.db.patch(id, {
         title: trimmedTitle,
         updatedAt: Date.now(),
      });
      return { success: true };
   },
});

/**
 * Search documents by title for a workspace, only non-deleted documents.
 */
export const searchDocuments = query({
   args: {
      workspaceId: v.id("workspaces"),
      query: v.string(),
   },
   handler: async (ctx, { workspaceId, query }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const q = query.trim();
      if (!q) {
         // Return recent documents for the user in this workspace (not deleted)
         return await ctx.db
            .query("documents")
            .withIndex("byWorkspaceUpdated", (q) => q.eq("workspaceId", workspaceId))
            .filter((qBuilder) =>
               qBuilder.and(
                  qBuilder.eq(qBuilder.field("authorId"), userId),
                  qBuilder.or(
                     qBuilder.eq(qBuilder.field("isDeleted"), false),
                     qBuilder.eq(qBuilder.field("isDeleted"), undefined),
                     qBuilder.eq(qBuilder.field("isDeleted"), null)
                  )
               )
            )
            .order("desc")
            .take(20);
      }
      // Use the search index for efficient full-text search
      const results = await ctx.db
         .query("documents")
         .withSearchIndex("search_title", (qBuilder) => qBuilder.search("title", q))
         .filter((qBuilder) =>
            qBuilder.and(
               qBuilder.eq(qBuilder.field("workspaceId"), workspaceId),
               qBuilder.eq(qBuilder.field("authorId"), userId),
               qBuilder.or(
                  qBuilder.eq(qBuilder.field("isDeleted"), false),
                  qBuilder.eq(qBuilder.field("isDeleted"), undefined),
                  qBuilder.eq(qBuilder.field("isDeleted"), null)
               )
            )
         )
         .collect();
      return results;
   },
});

/**
 * Toggle the collapsed state of a folder document.
 */
export const toggleCollapse = mutation({
   args: {
      workspaceId: v.id("workspaces"),
      id: v.id("documents"),
   },
   handler: async (ctx, { workspaceId, id }) => {
      const { userId } = await requireWorkspacePermission(ctx, workspaceId);
      const doc = await ctx.db.get(id);
      if (!doc) return { error: "Document not found" };
      if (doc.authorId !== userId || doc.workspaceId !== workspaceId) {
         return { error: "Unauthorized" };
      }
      if (doc.documentType !== "folder") {
         return { error: "Only folders can be collapsed" };
      }
      const newCollapsed = !doc.isCollapsed;
      await ctx.db.patch(id, { isCollapsed: newCollapsed, updatedAt: Date.now() });
      return { success: true, isCollapsed: newCollapsed };
   },
});

// TODO: Update all client calls to use _id instead of uuid for document operations. Remove uuid from all client-side types and API calls.

export const { getRateLimit: getCreateDocumentRateLimit, getServerTime: getCreateDocumentServerTime } = rateLimiter.hookAPI(
   "createDocument",
   {
      key: async (ctx) => {
         const identity = await ctx.auth.getUserIdentity();
         if (!identity) {
            return "NOT_AUTHENTICATED";
         }
         return identity.subject;
      },
   }
);
