import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@docsurf/backend/convex/_generated/api";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import type { Doc } from "@docsurf/backend/convex/_generated/dataModel";
import { buildTree, flattenTree } from "./components/utilities";
import type { TreeItem, TreeItems } from "./components/types";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { useSession } from "@/hooks/auth-hooks";

// Types for the Convex-based tree hook
interface UseConvexTreeOptions {
   workspaceId?: Id<"workspaces">;
}

interface TreeState {
   treeItems: TreeItems;
   documents: Doc<"documents">[];
   collapsedFolders: Set<string>;
   isLoading: boolean;
   error: string | null;
}

interface TreeActions {
   toggleCollapse: (folderId: string) => void;
   reorderItems: (activeId: string, overId: string, parentId: string | null, depth: number) => Promise<void>;
   addItem: (parentId: string | null, title: string, documentType: Doc<"documents">["documentType"]) => Promise<string | undefined>;
   updateItem: (
      id: string,
      updates: Partial<Pick<Doc<"documents">, "title" | "parentId" | "orderPosition" | "documentType">>
   ) => Promise<void>;
   removeItem: (id: string) => Promise<void>;
   isCollapsed: (id: string) => boolean;
   isFolder: (id: string) => boolean;
   getDocumentTitle: (id: string) => string;
   validateParentChildRelationship: (parentId: string | null, documentType: Doc<"documents">["documentType"]) => boolean;
}

const noopAsync = async () => {};
const noopAsyncString = async () => undefined;
const noop = () => false;
const noopStr = () => "";

// Helper function to convert Convex documents to tree items
const buildTreeFromDocuments = (documents: Doc<"documents">[] | undefined): TreeItems => {
   if (!Array.isArray(documents)) {
      console.warn("buildTreeFromDocuments: documents is not an array", documents);
      return [];
   }
   // Defensive: ensure documents is an array before using .filter and .map
   return buildTree(
      documents
         ? documents
              .filter((doc: Doc<"documents">) => doc && doc.documentType)
              .map((doc: Doc<"documents">, idx: number) => ({
                 id: doc._id,
                 parentId: (doc.parentId as unknown as Id<"documents">) ?? null,
                 depth: doc.depth,
                 children: [],
                 documentType: doc.documentType,
                 title: doc.title || DEFAULT_TEXT_TITLE,
                 orderPosition: doc.orderPosition,
                 updatedAt: "updatedAt" in doc && typeof doc.updatedAt === "number" ? doc.updatedAt : doc._creationTime,
                 index: idx,
              }))
         : []
   );
};

export const useConvexTree = ({ workspaceId }: UseConvexTreeOptions): TreeState & TreeActions => {
   // Check if user is authenticated
   const { data: session, isPending } = useSession();

   // Only allow queries when session is loaded and user is authenticated
   const isAuthenticated = !isPending && !!session?.user;

   // Always call these hooks, even if workspaceId is undefined
   const documents = useQuery(api.documents.fetchDocumentTree, workspaceId && isAuthenticated ? { workspaceId } : "skip");
   const createDoc = useMutation(api.documents.createDocument);
   const updateDoc = useMutation(api.documents.updateDocument);
   const deleteDoc = useMutation(api.documents.moveDocumentToTrash);
   const batchUpsert = useMutation(api.documents.batchUpsertDocuments).withOptimisticUpdate((localStore, args) => {
      if (!workspaceId || !isAuthenticated) return;
      const current = localStore.getQuery(api.documents.fetchDocumentTree, { workspaceId });
      if (!current || !Array.isArray(current.data)) return;
      // Build a map of updates by id
      const updatesById = Object.fromEntries(args.updates.map((update) => [update.id, update]));
      // Recalculate the entire tree structure, updating all affected docs
      const newDocs = current.data.map((doc) => {
         const update = updatesById[doc._id];
         if (!update) return doc;
         return {
            ...doc,
            parentId: update.parentId,
            orderPosition: update.orderPosition ?? 0,
            depth: update.depth ?? 0,
            documentType: update.documentType,
            updatedAt: update.updatedAt,
            isDeleted: update.isDeleted ?? doc.isDeleted,
            isCollapsed: typeof update.isCollapsed === "boolean" ? update.isCollapsed : doc.isCollapsed,
         };
      });
      // Sort by orderPosition for correct tree rendering
      newDocs.sort((a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0));
      localStore.setQuery(api.documents.fetchDocumentTree, { workspaceId }, { data: newDocs });
   });
   const toggleCollapseMutation = useMutation(api.documents.toggleCollapse).withOptimisticUpdate((localStore, args) => {
      // Optimistically update the isCollapsed field for the toggled folder
      const { workspaceId, id } = args;
      if (!isAuthenticated) return;
      const current = localStore.getQuery(api.documents.fetchDocumentTree, { workspaceId });
      if (!current || !Array.isArray(current.data)) return;
      const newDocs = current.data.map((doc) => {
         if (doc._id === id && doc.documentType === "folder") {
            return { ...doc, isCollapsed: !doc.isCollapsed };
         }
         return doc;
      });
      localStore.setQuery(api.documents.fetchDocumentTree, { workspaceId }, { data: newDocs });
   });

   // If workspaceId is not defined, return loading state and no-op actions
   if (!workspaceId) {
      return {
         treeItems: [],
         documents: [],
         collapsedFolders: new Set(),
         isLoading: true,
         error: null,
         toggleCollapse: () => {},
         reorderItems: noopAsync,
         addItem: noopAsyncString,
         updateItem: noopAsync,
         removeItem: noopAsync,
         isCollapsed: noop,
         isFolder: noop,
         getDocumentTitle: noopStr,
         validateParentChildRelationship: () => false,
      };
   }

   // Build tree from documents
   const queryResult = documents?.data;
   const treeItems = buildTreeFromDocuments(queryResult ?? []);
   const isLoading = queryResult === undefined;

   // Toggle collapse for folders (persisted)
   async function toggleCollapse(folderId: string) {
      const doc = documents?.data?.find((d: Doc<"documents">) => d._id === folderId);
      if (!doc || doc.documentType !== "folder") return;
      try {
         await toggleCollapseMutation({ workspaceId: workspaceId as Id<"workspaces">, id: folderId as Id<"documents"> });
      } catch (e) {
         showToast("Failed to toggle folder", "error");
      }
   }

   // Check if item is collapsed (persisted)
   function isCollapsed(id: string) {
      const doc = documents?.data?.find((d: Doc<"documents">) => d._id === id);
      return doc?.isCollapsed === true;
   }

   // Check if item is a folder
   function isFolder(id: string) {
      if (!Array.isArray(documents?.data)) {
         console.warn("isFolder: documents?.data is not an array", documents?.data);
         return false;
      }
      const doc = documents.data.find((d: Doc<"documents">) => d._id === id);
      return doc?.documentType === "folder";
   }

   // Get document title
   function getDocumentTitle(id: string) {
      if (!Array.isArray(documents?.data)) {
         console.warn("getDocumentTitle: documents?.data is not an array", documents?.data);
         return DEFAULT_TEXT_TITLE;
      }
      const doc = documents.data.find((d: Doc<"documents">) => d._id === id);
      return doc?.title || DEFAULT_TEXT_TITLE;
   }

   // Validate parent-child relationship
   function validateParentChildRelationship(parentId: string | null, documentType: Doc<"documents">["documentType"]) {
      if (documentType === "folder" || parentId === null) return true;
      return isFolder(parentId);
   }

   // Add new item
   async function addItem(
      parentId: string | null,
      title: string,
      documentType: Doc<"documents">["documentType"]
   ): Promise<string | undefined> {
      if (!workspaceId) {
         showToast("Workspace ID is missing", "error");
         return undefined;
      }
      try {
         const result = await createDoc({
            workspaceId,
            title,
            documentType,
            parentId: parentId as Id<"documents"> | undefined,
            orderPosition: 0, // Will be updated by reordering if needed
         });
         return result?.id;
      } catch (error) {
         console.error("Error adding item:", error);
         showToast("Failed to add item", "error");
         return undefined;
      }
   }

   // Update item
   async function updateItem(
      id: string,
      updates: Partial<Pick<Doc<"documents">, "title" | "parentId" | "orderPosition" | "documentType">>
   ): Promise<void> {
      if (!workspaceId) {
         showToast("Workspace ID is missing", "error");
         return;
      }
      try {
         await updateDoc({
            workspaceId,
            id: id as Id<"documents">,
            updates,
         });
      } catch (error) {
         console.error("Error updating item:", error);
         showToast("Failed to update item", "error");
      }
   }

   // Remove item
   async function removeItem(id: string): Promise<void> {
      if (!workspaceId) {
         showToast("Workspace ID is missing", "error");
         return;
      }
      try {
         await deleteDoc({
            workspaceId,
            id: id as Id<"documents">,
         });
      } catch (error) {
         console.error("Error removing item:", error);
         showToast("Failed to remove item", "error");
      }
   }

   // Reorder items
   async function reorderItems(activeId: string, overId: string, parentId: string | null, depth: number): Promise<void> {
      if (!workspaceId) {
         showToast("Workspace ID is missing", "error");
         return;
      }
      try {
         if (!Array.isArray(documents?.data)) {
            console.warn("reorderItems: documents?.data is not an array", documents?.data);
            return;
         }
         const activeDoc = documents.data.find((d: Doc<"documents">) => d._id === activeId);
         if (!activeDoc) {
            throw new Error("Active document not found");
         }
         if (parentId !== null && !isFolder(parentId)) {
            throw new Error("Cannot place items inside non-folder items");
         }
         if (!validateParentChildRelationship(parentId, activeDoc.documentType)) {
            throw new Error("Invalid parent-child relationship");
         }
         // Get all documents and build current tree
         const allDocs = documents.data;
         const currentTree = buildTreeFromDocuments(allDocs);
         const flattenedItems = flattenTree(currentTree);
         // Find the items to reorder
         const activeIndex = flattenedItems.findIndex((item) => item.id === activeId);
         const overIndex = flattenedItems.findIndex((item) => item.id === overId);
         if (activeIndex === -1 || overIndex === -1) return;
         // Reorder in memory
         const newFlattenedItems = [...flattenedItems];
         const [movedItem] = newFlattenedItems.splice(activeIndex, 1);
         if (!movedItem) return;
         movedItem.parentId = parentId;
         movedItem.depth = depth;
         newFlattenedItems.splice(overIndex, 0, movedItem);
         // Prepare updates for Convex
         const updates = newFlattenedItems
            .filter((item) => item.documentType)
            .map((item, index) => {
               const doc = documents.data.find((d: Doc<"documents">) => d._id === item.id);
               return {
                  id: item.id as Id<"documents">, // Include id for server-side update
                  parentId: item.parentId == null ? undefined : (item.parentId as Id<"documents">),
                  orderPosition: index,
                  documentType: item.documentType as Doc<"documents">["documentType"],
                  updatedAt: Date.now(),
                  isDeleted: doc?.isDeleted ?? false,
                  depth: item.depth,
               };
            });
         // Use batchUpsert with optimistic update
         await batchUpsert({ workspaceId, updates });
      } catch (error) {
         console.error("Error reordering documents:", error);
         showToast("Failed to reorder documents", "error");
      }
   }

   return {
      treeItems,
      documents: Array.isArray(documents?.data) ? documents.data : [],
      collapsedFolders: new Set(),
      isLoading,
      error: null,
      toggleCollapse,
      reorderItems,
      addItem,
      updateItem,
      removeItem,
      isCollapsed,
      isFolder,
      getDocumentTitle,
      validateParentChildRelationship,
   };
};
