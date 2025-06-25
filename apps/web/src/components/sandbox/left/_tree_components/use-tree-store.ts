import { create } from "zustand";
import { useQuery } from "convex/react";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convertDocumentsToTreeItems } from "./utils/tree-store.utils";

import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { useMemo } from "react";

import type { TreeState, TreeAction } from "./types/tree-store.types";
import { throttle } from "throttle-debounce";
import { env } from "@/env";
import type { Doc } from "@docsurf/backend/convex/_generated/dataModel";
import { buildTree, flattenTree } from "./components/utilities";
import type { TreeItem, TreeItems } from "./components/types";
import { DEFAULT_TITLE } from "@/utils/constants";

// Constants for tree logic
export const TREE_CONSTANTS = {
   THROTTLE_DELAY: 500,
   MAX_TREE_DEPTH: 3,
} as const;

type Document = Doc<"documents">;

// Simplified throttled update function
const throttledUpdateOrderPositions = throttle(
   TREE_CONSTANTS.THROTTLE_DELAY,
   async (
      updates: Array<{
         _id: string;
         parentId: string | null;
         order_position: number;
         document_type: Document["documentType"];
         updated_at: string;
      }>,
      onSuccess: () => void,
      onError: (error: Error) => void
   ) => {
      try {
         // TODO: Replace Supabase upsert logic with Convex or other backend
         const error = null;
         if (error) throw error;
         onSuccess();
      } catch (error: unknown) {
         console.error("Error updating order positions:", error);
         onError(error instanceof Error ? error : new Error("Unknown error occurred"));
      }
   }
);

const initialState: TreeState = {
   items: [],
   loading: true,
   error: null,
   documentTitles: {},
   documentTypes: {},
   collapsedItems: {},
   loadedFolders: {},
   loadingFolders: {},
   lastOrderPosition: {},
};

// Memoized helper functions
const memoizedUpdateItemInTree = (items: TreeItems, targetId: string, newChildren: TreeItems = [], isToggle = false): TreeItems => {
   return items.map((item) => {
      if (item.id === targetId) {
         return isToggle ? { ...item, collapsed: !item.collapsed } : { ...item, children: newChildren };
      }
      if (item.children.length > 0) {
         return { ...item, children: memoizedUpdateItemInTree(item.children, targetId, newChildren, isToggle) };
      }
      return item;
   });
};

export const useTreeStore = create<TreeState & TreeAction>()((set, get) => ({
   ...initialState,

   fetchTreeAsync: async () => {
      set({ loading: true, error: null });
      try {
         // Get current user and workspaceId
         const user = await (await import("convex/react")).useQuery(api.auth.getCurrentUser, {});
         const workspaceId = user?.workspaces?.[0]?.workspace?._id;
         if (!workspaceId) {
            set({ items: [], loading: false, error: "No workspace found" });
            return;
         }
         // Fetch document tree
         const result = await (await import("convex/react")).useQuery(api.documents.fetchDocumentTree, { workspaceId });
         const documents = result?.data || [];
         const items = convertDocumentsToTreeItems(documents);
         // Build documentTitles and documentTypes
         const documentTitles: Record<string, string> = {};
         const documentTypes: Record<string, Doc<"documents">["documentType"]> = {};
         documents.forEach((doc: any) => {
            documentTitles[doc._id] = doc.title || DEFAULT_TITLE;
            documentTypes[doc._id] = doc.documentType;
         });
         set({ items, documentTitles, documentTypes, loading: false, error: null });
      } catch (error: any) {
         console.error("Error fetching document tree:", error);
         set({ items: [], loading: false, error: error?.message || "Failed to fetch document tree" });
         showToast("Failed to fetch document tree", "error");
      }
   },

   fetchFolderChildrenAsync: async (folderId: string) => {
      // TODO: Replace Supabase fetch logic with Convex or other backend
      set((state) => ({ loadingFolders: { ...state.loadingFolders, [folderId]: false } }));
   },

   addItemAsync: async (parentId: string | null, title: string, documentType: Doc<"documents">["documentType"]) => {
      // TODO: Replace Supabase insert logic with Convex or other backend
      return undefined;
   },

   updateItemAsync: async (
      id: string,
      updates: Partial<Pick<Doc<"documents">, "title" | "parentId" | "orderPosition" | "documentType">>
   ) => {
      // TODO: Replace Supabase update logic with Convex or other backend
   },

   removeItemAsync: async (id: string): Promise<void> => {
      // TODO: Replace Supabase delete logic with Convex or other backend
   },

   toggleCollapse: (id: string) => {
      const isFolder = get().documentTypes[id] === "folder";
      if (!isFolder) return;

      set((state) => {
         const isCollapsed = !state.collapsedItems[id];
         const collapsedItems = { ...state.collapsedItems, [id]: isCollapsed };

         if (!isCollapsed && !state.loadedFolders[id]) {
            setTimeout(() => get().fetchFolderChildrenAsync(id), 0);
         }

         return {
            items: state.items.map((item) =>
               item.id === id
                  ? { ...item, collapsed: isCollapsed }
                  : item.children.length > 0
                  ? { ...item, children: memoizedUpdateItemInTree(item.children, id, [], true) }
                  : item
            ),
            collapsedItems,
         };
      });
   },

   handleRealtimeUpdate: (payload: any) => {
      try {
         const { eventType, new: newDoc, old } = payload;

         // If we get any update, force a refresh of the tree
         get().fetchTreeAsync();

         // We'll still process the update locally for immediate feedback
         set((state) => {
            const newState = { ...state };
            const { items, documentTitles, documentTypes } = newState;

            switch (eventType) {
               case "INSERT": {
                  if (!newDoc._id || !newDoc.document_type) {
                     console.warn("Invalid document data received:", newDoc);
                     return state;
                  }

                  const parentId = newDoc.parentId;
                  const newItem: TreeItem = {
                     id: newDoc._id,
                     children: [],
                  };

                  if (parentId) {
                     newState.items = items.map((item) => {
                        if (item.id === parentId) {
                           return {
                              ...item,
                              children: [...item.children, newItem],
                           };
                        }
                        return item;
                     });
                  } else {
                     newState.items = [...items, newItem];
                  }

                  newState.documentTitles = {
                     ...documentTitles,
                     [newDoc._id]: newDoc.title || DEFAULT_TITLE,
                  };
                  newState.documentTypes = {
                     ...documentTypes,
                     [newDoc._id]: newDoc.document_type,
                  };
                  break;
               }

               case "UPDATE": {
                  if (!newDoc._id) {
                     console.warn("Invalid update data received:", newDoc);
                     return state;
                  }

                  if (newDoc.title !== undefined) {
                     newState.documentTitles = {
                        ...documentTitles,
                        [newDoc._id]: newDoc.title || DEFAULT_TITLE,
                     };
                  }
                  if (newDoc.document_type) {
                     newState.documentTypes = {
                        ...documentTypes,
                        [newDoc._id]: newDoc.document_type,
                     };
                  }
                  break;
               }

               case "DELETE": {
                  if (!old.id) {
                     console.warn("Invalid deletion data received:", old);
                     return state;
                  }

                  const itemId = String(old.id);

                  const removeItem = (items: TreeItems): TreeItems => {
                     return items.filter((item) => {
                        if (item.id === itemId) return false;
                        if (item.children.length > 0) {
                           item.children = removeItem(item.children);
                        }
                        return true;
                     });
                  };

                  newState.items = removeItem(items);

                  const newDocumentTitles = { ...documentTitles };
                  const newDocumentTypes = { ...documentTypes };
                  delete newDocumentTitles[itemId];
                  delete newDocumentTypes[itemId];
                  newState.documentTitles = newDocumentTitles;
                  newState.documentTypes = newDocumentTypes;
                  break;
               }
            }

            return newState;
         });
      } catch (error) {
         console.error("Error in handleRealtimeUpdate:", error);
         // Instead of throwing, force a refresh
         get().fetchTreeAsync();
      }
   },

   reorderItems: (activeId, overId, parentId, depth) => {
      try {
         const activeItemType = get().documentTypes[activeId];
         if (!activeItemType) {
            throw new Error("Document type is required for parent-child validation");
         }

         if (parentId !== null && !get().isFolder(parentId)) {
            throw new Error("Cannot place items inside non-folder items");
         }

         if (!get().validateParentChildRelationship(parentId, activeItemType)) {
            throw new Error("Invalid parent-child relationship");
         }

         const { items } = get();
         const flattenedItems = flattenTree(items);
         const activeItemIndex = flattenedItems.findIndex((item) => item.id === activeId);
         const overItemIndex = flattenedItems.findIndex((item) => item.id === overId);

         if (activeItemIndex === -1 || overItemIndex === -1) return;

         const newFlattenedItems = [...flattenedItems];
         const [movedItem] = newFlattenedItems.splice(activeItemIndex, 1);
         if (!movedItem) return;

         movedItem.parentId = parentId;
         movedItem.depth = depth;
         newFlattenedItems.splice(overItemIndex, 0, movedItem);

         const newItems = buildTree(newFlattenedItems);
         set((state) => ({
            items: newItems,
            lastOrderPosition: {
               ...state.lastOrderPosition,
               [parentId || "root"]: newFlattenedItems.length - 1,
            },
         }));

         const updates = newFlattenedItems.map((item, index) => {
            const documentType = get().documentTypes[item.id];
            if (!documentType) {
               throw new Error(`Document type not found for item ${item.id}`);
            }
            return {
               _id: item.id as string,
               parentId: item.parentId as string | null,
               order_position: index,
               document_type: documentType,
               updated_at: new Date().toISOString(),
            };
         });

         throttledUpdateOrderPositions(
            updates,
            () => console.log("Documents reordered successfully"),
            (error) => {
               set({ items }); // Revert on error
               showToast(`Failed to update document order${error}`, "error");
            }
         );
      } catch (error) {
         console.error("Error reordering documents:", error);
         showToast("Failed to reorder documents", "error");
      }
   },

   getDocumentTitle: (id: string) => get().documentTitles[id] || DEFAULT_TITLE,
   isFolder: (id: string) => get().documentTypes[id] === "folder",
   isFolderLoaded: (id: string) => get().loadedFolders[id] || false,
   isFolderLoading: (id: string) => get().loadingFolders[id] || false,
   isItemCollapsed: (id: string) => get().collapsedItems[id] || false,

   validateParentChildRelationship: (parentId: string | null, documentType: Doc<"documents">["documentType"]) => {
      if (documentType === "folder" || parentId === null) return true;
      return get().isFolder(parentId);
   },

   loadCollapsedStates: () => {
      // No-op since we're not using storage anymore
   },

   saveCollapsedStates: () => {
      // No-op since we're not using storage anymore
   },
}));

// Helper function for updating items in the tree
const updateItemInTree = (items: TreeItems, targetId: string, newChildren: TreeItems = [], isToggle = false): TreeItems => {
   return items.map((item) => {
      if (item.id === targetId) {
         return isToggle ? { ...item, collapsed: !item.collapsed } : { ...item, children: newChildren };
      }
      if (item.children.length > 0) {
         return { ...item, children: updateItemInTree(item.children, targetId, newChildren, isToggle) };
      }
      return item;
   });
};

// Export memoized selectors for use in components
export const useTreeSelectors = () => {
   const store = useTreeStore();

   return useMemo(
      () => ({
         getDocumentTitle: store.getDocumentTitle,
         isFolder: store.isFolder,
         isFolderLoaded: store.isFolderLoaded,
         isFolderLoading: store.isFolderLoading,
         isItemCollapsed: store.isItemCollapsed,
      }),
      [store]
   );
};

// Export memoized actions for use in components
export const useTreeActions = () => {
   const store = useTreeStore();

   return useMemo(
      () => ({
         toggleCollapse: store.toggleCollapse,
         validateParentChildRelationship: store.validateParentChildRelationship,
         fetchTreeAsync: store.fetchTreeAsync,
         fetchFolderChildrenAsync: store.fetchFolderChildrenAsync,
         addItemAsync: store.addItemAsync,
         updateItemAsync: store.updateItemAsync,
         removeItemAsync: store.removeItemAsync,
         reorderItems: store.reorderItems,
      }),
      [store]
   );
};
