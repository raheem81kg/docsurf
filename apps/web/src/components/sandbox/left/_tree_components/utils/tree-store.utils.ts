import type { Doc } from "@docsurf/backend/convex/_generated/dataModel";
import type { TreeItems } from "../components/types";
import { MAX_TITLE_LENGTH } from "@/utils/constants";
// import { v4 as uuidv4 } from "uuid";

// export const validateFile = (file: File): { isValid: boolean; error?: string } => {
//    if (file.size > MAX_FILE_SIZE) {
//       return { isValid: false, error: "File size exceeds limit" };
//    }

//    if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
//       return { isValid: false, error: "File type not allowed" };
//    }

//    return { isValid: true };
// };
type Document = Doc<"documents">;

export const sanitizeTitle = (title: string): string => {
   return title
      .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
      .trim()
      .slice(0, MAX_TITLE_LENGTH);
};

// export const generateUploadId = (file: File): string => {
//    return `${uuidv4()}-${file.name}`;
// };

export const validateCircularReference = (items: TreeItems, parentId: string | null, newParentId: string | null): boolean => {
   if (!newParentId) return true;

   const visited = new Set<string>();
   const checkCycle = (id: string): boolean => {
      if (id === newParentId) return true;
      if (visited.has(id)) return false;
      visited.add(id);

      const item = items.find((i) => i.id === id);
      if (!item) return false;

      return item.children.some((child) => checkCycle(child.id as string));
   };

   return !checkCycle(parentId as string);
};

export const convertDocumentsToTreeItems = (documents: Document[]): TreeItems => {
   // Create a map of all documents by _id
   const documentsMap = new Map<string, Document>();
   documents.forEach((document) => {
      documentsMap.set(document._id, document);
   });

   // Create a map of parent-child relationships
   const childrenMap = new Map<string, string[]>();
   documents.forEach((document) => {
      if (document.parentId) {
         if (!childrenMap.has(document.parentId)) {
            childrenMap.set(document.parentId, []);
         }
         childrenMap.get(document.parentId)?.push(document._id);
      }
   });

   // Helper function to build tree items recursively
   const buildTreeItems = (parentId: string | null): TreeItems => {
      // Get all documents that have this parent
      const childIds = parentId ? childrenMap.get(parentId) || [] : documents.filter((d) => !d.parentId).map((d) => d._id);

      // Sort by orderPosition
      const sortedChildIds = childIds.sort((a, b) => {
         const documentA = documentsMap.get(a);
         const documentB = documentsMap.get(b);
         return (documentA?.orderPosition || 0) - (documentB?.orderPosition || 0);
      });

      // Build tree items
      return sortedChildIds.map((id) => {
         const document = documentsMap.get(id);
         if (!document) return { id, children: [] };

         return {
            id: document._id,
            children: buildTreeItems(document._id),
         };
      });
   };

   return buildTreeItems(null);
};
