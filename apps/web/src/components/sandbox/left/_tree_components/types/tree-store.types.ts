import type { TreeItems } from "../components/types";
import type { Doc } from "@docsurf/backend/convex/_generated/dataModel";

export type TreeState = {
   items: TreeItems;
   loading: boolean;
   error: string | null;
   documentTitles: Record<string, string>;
   documentTypes: Record<string, Doc<"documents">["documentType"]>;
   collapsedItems: Record<string, boolean>;
   loadedFolders: Record<string, boolean>;
   loadingFolders: Record<string, boolean>;
   lastOrderPosition: Record<string, number>;
};

export type TreeAction = {
   fetchTreeAsync: () => Promise<void>;
   fetchFolderChildrenAsync: (folderId: string) => Promise<void>;
   addItemAsync: (
      parentId: string | null,
      title: string,
      documentType: Doc<"documents">["documentType"],
      file?: File
   ) => Promise<string | undefined>;
   updateItemAsync: (
      id: string,
      updates: Partial<Pick<Doc<"documents">, "title" | "parentId" | "orderPosition" | "documentType">>
   ) => Promise<void>;
   removeItemAsync: (id: string) => Promise<void>;
   toggleCollapse: (id: string) => void;
   reorderItems: (activeId: string, overId: string, parentId: string | null, depth: number) => void;
   getDocumentTitle: (id: string) => string;
   isFolder: (id: string) => boolean;
   validateParentChildRelationship: (parentId: string | null, documentType: Doc<"documents">["documentType"]) => boolean;
   isFolderLoaded: (folderId: string) => boolean;
   isFolderLoading: (folderId: string) => boolean;
   isItemCollapsed: (itemId: string) => boolean;
   loadCollapsedStates: () => void;
   saveCollapsedStates: () => void;
};
