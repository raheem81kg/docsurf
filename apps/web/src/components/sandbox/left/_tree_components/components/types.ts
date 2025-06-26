import type { RefObject } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";

export interface TreeItem {
   id: UniqueIdentifier;
   children: TreeItem[];
   collapsed?: boolean;
   createdAt?: number;
   updatedAt?: number;
   documentType?: string;
   title?: string;
}

export type TreeItems = TreeItem[];

export interface FlattenedItem extends TreeItem {
   parentId: UniqueIdentifier | null;
   depth: number;
   index: number;
}

export type SensorContext = RefObject<{
   items: FlattenedItem[];
   offset: number;
}>;
