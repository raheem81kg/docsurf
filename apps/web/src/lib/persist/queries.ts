/**
 * Document versioning persistence API for Dexie (doc_versions table).
 * Provides CRUD operations for document versions in the browser.
 */
import { db, type DocVersion } from "./dexie-persist";

/**
 * Maximum number of versions to keep per document.
 */
export const MAX_VERSIONS_PER_DOC = 20;

/**
 * Maximum number of versions to keep across all documents.
 */
export const MAX_VERSIONS_TOTAL = 200;

/**
 * Prune old versions if we exceed MAX_VERSIONS_PER_DOC or MAX_VERSIONS_TOTAL.
 * Keeps the most recent versions and deletes the rest.
 * Uses bulk operations and proper indexing for efficiency.
 */
const pruneOldVersions = async (docId: string) => {
   await db.transaction("rw", db.doc_versions, async () => {
      // First, check and prune per-document limit using index
      const docVersions = await db.doc_versions.where("docId").equals(docId).sortBy("timestamp");

      if (docVersions.length > MAX_VERSIONS_PER_DOC) {
         const versionsToDelete = docVersions.slice(0, docVersions.length - MAX_VERSIONS_PER_DOC);
         await db.doc_versions.bulkDelete(versionsToDelete.map((v) => v.id));
      }

      // Then, check and prune overall limit using index
      const totalCount = await db.doc_versions.count();
      if (totalCount > MAX_VERSIONS_TOTAL) {
         const versionsToDelete = await db.doc_versions
            .orderBy("timestamp")
            .limit(totalCount - MAX_VERSIONS_TOTAL)
            .toArray();

         await db.doc_versions.bulkDelete(versionsToDelete.map((v) => v.id));
      }
   });
};

/**
 * Get all versions for a document, sorted by timestamp descending (latest first).
 */
export const getDocVersions = async (docId: string) => {
   const versions = await db.doc_versions.where("docId").equals(docId).sortBy("timestamp");
   return versions.reverse();
};

/**
 * Get the latest version for a document.
 */
export const getLatestDocVersion = async (docId: string) => {
   const versions = await getDocVersions(docId);
   return versions[0];
};

/**
 * Create a new version for a document.
 * Automatically prunes old versions if MAX_VERSIONS_PER_DOC or MAX_VERSIONS_TOTAL is exceeded.
 */
export const createDocVersion = async (
   docId: string,
   content: any,
   saveReason: DocVersion["saveReason"],
   changesSinceLastSave: number,
   timeSinceLastSave: number,
   wordCount: number
) => {
   const now = Date.now();
   const version: DocVersion = {
      id: `${docId}:${now}`,
      docId,
      timestamp: now,
      content,
      saveReason,
      changesSinceLastSave,
      timeSinceLastSave,
      wordCount,
   };

   await db.transaction("rw", db.doc_versions, async () => {
      await db.doc_versions.add(version);
      await pruneOldVersions(docId);
   });

   return version;
};

/**
 * Update an existing version.
 */
export const updateDocVersion = async (id: string, updates: Partial<DocVersion>) => {
   return await db.doc_versions.update(id, {
      ...updates,
      timestamp: Date.now(),
   });
};

/**
 * Delete a specific version.
 */
export const deleteDocVersion = async (id: string) => {
   return await db.doc_versions.delete(id);
};

/**
 * Delete all versions for a document.
 */
export const deleteDocVersions = async (docId: string) => {
   return await db.doc_versions.where("docId").equals(docId).delete();
};

/**
 * Delete all versions from all documents.
 */
export const deleteAllDocVersions = async () => {
   return await db.doc_versions.clear();
};

/**
 * Get versions within a time range for a document.
 */
export const getDocVersionsInRange = async (docId: string, startTime: number, endTime: number) => {
   return await db.doc_versions.where("[docId+timestamp]").between([docId, startTime], [docId, endTime]);
};
