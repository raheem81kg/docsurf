"use client";
import React, { type CSSProperties } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { type AnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TreeItem, type Props as TreeItemProps } from "./TreeItem";
import { iOS } from "../utilities";

interface Props extends TreeItemProps {
   id: UniqueIdentifier;
   isLoading?: boolean;
   isEmptyFolder?: boolean;
   activeId?: UniqueIdentifier;
}

const animateLayoutChanges: AnimateLayoutChanges = ({ isSorting, wasDragging }) => {
   // Always animate layout changes unless we're actively sorting or dragging
   if (isSorting || wasDragging) return false;

   // Return true to enable animation with default duration
   return true;
};

function SortableTreeItemComponent({ id, depth, isLoading, isEmptyFolder, activeId, ...props }: Props) {
   const { attributes, listeners, setDraggableNodeRef, setDroppableNodeRef, transform, transition } = useSortable({
      id,
      animateLayoutChanges,
   });

   const style: CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
   };

   // Only apply drag listeners to the handle, not the entire item
   const handleProps = {
      ...attributes,
      ...listeners,
   };

   const isActive = id === activeId;

   return (
      <TreeItem
         ref={setDraggableNodeRef}
         wrapperRef={setDroppableNodeRef}
         style={style}
         depth={depth}
         ghost={isActive}
         disableSelection={iOS}
         disableInteraction={isActive}
         data-dnd-draggable
         isLoading={isLoading}
         isEmptyFolder={isEmptyFolder}
         handleProps={handleProps}
         {...props}
      />
   );
}

export const SortableTreeItem = SortableTreeItemComponent;
