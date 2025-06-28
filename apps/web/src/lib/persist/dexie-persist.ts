/**
 * Dexie database instance and schema for document versioning.
 * Provides a singleton Dexie instance for use throughout the app.
 *
 * Fields:
 * - content: JSON content of the document version
 * - contentHash: hash of normalized content for deduplication
 * - metadata: object for storing version metadata (user, reason, etc.)
 * - timestamp: when the version was created
 * - saveReason: why the version was saved (interval, idle, significant-change, etc.)
 * - changesSinceLastSave: number of characters changed since last save
 * - timeSinceLastSave: milliseconds since last save
 * - wordCount: number of words in the document
 */
import Dexie, { type EntityTable } from "dexie";

/**
 * Represents a single version of a document for local versioning.
 */
export interface DocVersion {
   id: string; // `${docId}:${timestamp}`
   docId: string;
   timestamp: number;
   content: any; // JSON content from editor
   saveReason: "interval" | "idle" | "significant-change" | "debounced-threshold" | "blur" | "manual";
   changesSinceLastSave: number;
   timeSinceLastSave: number;
   wordCount: number;
   contentHash: string; // hash of normalized content for deduplication
}

/**
 * Dexie database class for DocSurf.
 */
class DocSurfDexie extends Dexie {
   doc_versions!: EntityTable<DocVersion, "id">;
}

/**
 * Singleton Dexie instance for the app.
 */
const db = new DocSurfDexie("docsurf-db");
db.version(1).stores({
   doc_versions: "id, docId, version, createdAt, timestamp, contentHash, saveReason", // Added timestamp and saveReason indexes
});

/**
 * Clear all data from all tables in the Dexie database.
 */
export async function clearAllDexieData() {
   await db.doc_versions.clear();
}

export { db, DocSurfDexie };
