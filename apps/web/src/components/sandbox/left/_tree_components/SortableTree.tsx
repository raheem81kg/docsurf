"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
   type Announcements,
   DndContext,
   closestCenter,
   KeyboardSensor,
   PointerSensor,
   useSensor,
   useSensors,
   type DragStartEvent,
   DragOverlay,
   type DragMoveEvent,
   type DragEndEvent,
   type DragOverEvent,
   MeasuringStrategy,
   type DropAnimation,
   type Modifier,
   defaultDropAnimation,
   type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
   buildTree,
   flattenTree,
   getProjection,
   getChildCount,
   removeItem,
   removeChildrenOf,
   setProperty,
} from "./components/utilities";
import type { FlattenedItem, SensorContext, TreeItems, TreeItem } from "./components/types";
import { sortableTreeKeyboardCoordinates } from "./components/keyboardCoordinates";
import { SortableTreeItem } from "./components/TreeItem/SortableTreeItem";
import { CSS } from "@dnd-kit/utilities";
import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { VList } from "virtua";
import { useNavigate, useLocation, useParams } from "@tanstack/react-router";
import { Route as DocRoute } from "@/routes/_main/doc.$documentId";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { DEFAULT_TEXT_TITLE, MAX_TREE_DEPTH } from "@/utils/constants";
import { motion } from "motion/react";
import { CAN_USE_DOM } from "@docsurf/ui/lib/utils";
import { api } from "@docsurf/backend/convex/_generated/api";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { useConvexTree } from "./use-convex-tree";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { CurrentUser } from "@docsurf/backend/convex/auth";

const measuring = {
   droppable: {
      strategy: MeasuringStrategy.Always,
   },
};

const dropAnimationConfig: DropAnimation = {
   keyframes({ transform }) {
      return [
         { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
         {
            opacity: 0,
            transform: CSS.Transform.toString({
               ...transform.final,
               x: transform.final.x + 5,
               y: transform.final.y + 5,
            }),
         },
      ];
   },
   easing: "ease-out",
   sideEffects({ active }) {
      active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
         duration: defaultDropAnimation.duration,
         easing: defaultDropAnimation.easing,
      });
   },
};

interface Props {
   collapsible?: boolean;
   indentationWidth?: number;
   indicator?: boolean;
   removable?: boolean;
}

// Export TreeSkeleton component
export function TreeSkeleton() {
   return (
      <div className="flex flex-col">
         {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
               <Skeleton className="h-6 rounded-sm w-6 shrink-0" /> {/* Icon */}
               <Skeleton className="h-6 rounded-sm flex-1" /> {/* Title */}
            </div>
         ))}
      </div>
   );
}

function NoItems() {
   return (
      <div className="flex items-center justify-center h-full">
         <motion.div
            className="text-center text-muted-foreground font-medium pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
               duration: 0.3,
               ease: "easeOut",
            }}
         >
            <motion.p
               className="md:text-sm text-base"
               initial={{ y: 5, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1 }}
            >
               No documents yet
            </motion.p>
            <motion.p
               className="md:text-xs text-sm mt-1"
               initial={{ y: 5, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
            >
               Create your first document to get started
            </motion.p>
         </motion.div>
      </div>
   );
}

/**
 * Fetches the current document using the documentId from the route and workspaceId from user session.
 * @returns The document object, or undefined/null if loading or not found.
 */
export function useCurrentDocument(user: CurrentUser | undefined, userLoading: boolean) {
   let documentId: string | undefined;
   try {
      documentId = useParams({ strict: false }).documentId;
   } catch {
      documentId = undefined;
   }
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;

   // Always call the hook, but only enable it when you have the data
   const enabled = !!documentId && !!workspaceId && !userLoading;
   const { data: doc, isLoading: docLoading } = useQuery(
      convexQuery(
         api.documents.fetchDocumentById,
         enabled
            ? {
                 id: documentId as Id<"documents">,
                 workspaceId: workspaceId as Id<"workspaces">,
              }
            : "skip"
      )
   );

   // Return loading state if user is loading, or if the query is not enabled
   // Also return loading state if the query is enabled but still loading
   if (userLoading || (enabled && docLoading)) {
      return { doc: undefined, docLoading: true };
   }
   if (!enabled) {
      return { doc: undefined, docLoading: false };
   }
   return { doc, docLoading: false };
}

export function SortableTree({ collapsible, indicator = false, indentationWidth = 28, removable }: Props) {
   // Get workspace ID from user
   const { data: user, isLoading: userLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;

   const currentDocument = useCurrentDocument(user, userLoading);

   const {
      treeItems,
      isLoading,
      toggleCollapse,
      reorderItems,
      addItem,
      removeItem,
      isCollapsed: isCollapsedFn,
      isFolder,
      getDocumentTitle,
   } = useConvexTree({ workspaceId: workspaceId as Id<"workspaces"> });

   const navigate = useNavigate();

   const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
   const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
   const [offsetLeft, setOffsetLeft] = useState(0);
   const [currentPosition, setCurrentPosition] = useState<{
      parentId: UniqueIdentifier | null;
      overId: UniqueIdentifier;
   } | null>(null);

   let flattenedItems: FlattenedItem[] = [];
   if (!Array.isArray(treeItems)) {
      console.warn("flattenedItems: treeItems is not an array", treeItems);
   } else {
      const flattenedTree = flattenTree(treeItems);
      const collapsedItems = flattenedTree.reduce<string[]>(
         (acc, { id }) => (isCollapsedFn(id as string) ? [...acc, id.toString()] : acc),
         []
      );
      flattenedItems = removeChildrenOf(flattenedTree, activeId != null ? [activeId, ...collapsedItems] : collapsedItems);
   }

   const projected =
      activeId && overId
         ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth, (id) => isFolder(id as string))
         : null;
   const sensorContext: SensorContext = useRef({
      items: flattenedItems,
      offset: offsetLeft,
   });
   const [coordinateGetter] = useState(() => sortableTreeKeyboardCoordinates(sensorContext, indicator, indentationWidth));
   const sensors = useSensors(
      useSensor(PointerSensor, {
         activationConstraint: {
            delay: 250,
            tolerance: 8,
            distance: 5,
         },
      }),
      useSensor(KeyboardSensor, {
         coordinateGetter,
      })
   );

   const sortedIds = flattenedItems.map(({ id }) => id);
   const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;
   const overItem = overId ? flattenedItems.find(({ id }) => id === overId) : null;

   useEffect(() => {
      sensorContext.current = {
         items: flattenedItems,
         offset: offsetLeft,
      };
   }, [flattenedItems, offsetLeft]);

   const announcements: Announcements = {
      onDragStart({ active }) {
         return `Picked up ${active.id}.`;
      },
      onDragMove({ active, over }) {
         return getMovementAnnouncement("onDragMove", active.id, over?.id);
      },
      onDragOver({ active, over }) {
         return getMovementAnnouncement("onDragOver", active.id, over?.id);
      },
      onDragEnd({ active, over }) {
         return getMovementAnnouncement("onDragEnd", active.id, over?.id);
      },
      onDragCancel({ active }) {
         return `Moving was cancelled. ${active.id} was dropped in its original position.`;
      },
   };

   const handleAddItem = async (parentId: UniqueIdentifier | null = null) => {
      try {
         const title = DEFAULT_TEXT_TITLE;
         const newId = await addItem(parentId as string | null, title, "text/plain");
         if (newId) {
            showToast("Document added successfully", "success");
         }
      } catch (error: any) {
         if (
            error?.message?.includes("limit user documents") ||
            error?.message?.toLowerCase().includes("quota") ||
            error?.message?.toLowerCase().includes("limit")
         ) {
            showToast(
               "You have reached the maximum number of documents (500). Please delete some documents to create new ones.",
               "error"
            );
         } else {
            console.error("Error adding item:", error);
            showToast("Failed to add item", "error");
         }
      }
   };

   const handleRemove = async (id: UniqueIdentifier) => {
      await removeItem(id as string);
      if (currentDocument?.doc && currentDocument.doc._id === id) {
         navigate({ to: "/doc" });
      }
   };

   const handleCollapse = (id: UniqueIdentifier) => {
      toggleCollapse(id as string);
   };

   const renderTreeItem = ({ id, children, collapsed, depth, updatedAt, documentType, orderPosition, ...rest }: any) => {
      const isItemFolder = isFolder(id as string);
      const isCollapsed = isItemFolder ? isCollapsedFn(id as string) : false;
      const isEmptyFolder = isItemFolder && !isCollapsed && children.length === 0;
      // these are very fragile, and need to be refactored (if you don't use () => for the onCollapse, onRemove, onAddChild, it will loop infinitely and flood the database with new items)
      const onAddChild = () => handleAddItem(id);
      const onRemove = removable ? () => handleRemove(id) : undefined;
      const onCollapse = collapsible && isItemFolder ? () => handleCollapse(id) : undefined;
      const { parentId, ...restProps } = rest;
      // documentType and orderPosition are intentionally omitted from restProps
      return (
         <SortableTreeItem
            className="list-none"
            key={id}
            id={id}
            value={String(id)}
            title={getDocumentTitle(id as string) || DEFAULT_TEXT_TITLE}
            depth={id === activeId && projected ? projected.depth : depth}
            indentationWidth={indentationWidth}
            indicator={indicator}
            collapsed={isCollapsed}
            onCollapse={onCollapse}
            onRemove={onRemove}
            onAddChild={onAddChild}
            isFolder={isItemFolder}
            isLoading={false}
            isEmptyFolder={isEmptyFolder}
            isDraggingOver={Boolean(activeId && id === overId && children.length > 0 && projected?.parentId === id)}
            activeId={activeId}
            updatedAt={updatedAt}
            {...restProps}
         />
      );
   };

   if (isLoading) {
      return <TreeSkeleton />;
   }

   if (!isLoading && (!Array.isArray(flattenedItems) || flattenedItems.length === 0)) {
      if (!Array.isArray(flattenedItems)) {
         console.warn("SortableTree: flattenedItems is not an array", flattenedItems);
      }
      return <NoItems />;
   }

   return (
      <div className="w-full h-full flex flex-col">
         {/* <button
            onClick={() => handleAddItem()}
            className="mb-2 flex items-center gap-1.5 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-sm transition-colors duration-150"
         >
            <PlusIcon size={16} className="size-4" />
            Add Item
         </button> */}
         <div className="relative flex-1 min-h-0">
            <DndContext
               accessibility={{ announcements }}
               sensors={sensors}
               collisionDetection={closestCenter}
               measuring={measuring}
               onDragStart={handleDragStart}
               onDragMove={handleDragMove}
               onDragOver={handleDragOver}
               onDragEnd={handleDragEnd}
               onDragCancel={handleDragCancel}
            >
               <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
                  <VList
                     className="relative isolate h-full overflow-hidden"
                     style={{
                        height: "100%",
                        scrollbarWidth: "thin",
                        scrollbarColor: "var(--border) transparent",
                     }}
                  >
                     <div className="flex flex-col md:space-y-[1px] space-y-1.5">{flattenedItems.map(renderTreeItem)}</div>
                  </VList>
               </SortableContext>
               {CAN_USE_DOM &&
                  createPortal(
                     <DragOverlay dropAnimation={dropAnimationConfig} modifiers={[restrictToWindowEdges, adjustTranslate]}>
                        {activeId && activeItem ? (
                           <SortableTreeItem
                              id={activeId}
                              depth={activeItem.depth}
                              clone
                              title={getDocumentTitle(activeId as string) || DEFAULT_TEXT_TITLE}
                              childCount={getChildCount(treeItems, activeId) + 1}
                              value={activeId.toString()}
                              indentationWidth={indentationWidth}
                              isFolder={isFolder(activeId as string)}
                              isLoading={false}
                              activeId={activeId}
                           />
                        ) : null}
                     </DragOverlay>,
                     document.body
                  )}
            </DndContext>
         </div>
      </div>
   );

   // Only update state if value actually changes
   function setActiveIdIfChanged(newId: UniqueIdentifier | null) {
      setActiveId((prev) => (prev !== newId ? newId : prev));
   }
   function setOverIdIfChanged(newId: UniqueIdentifier | null) {
      setOverId((prev) => (prev !== newId ? newId : prev));
   }
   function setOffsetLeftIfChanged(newOffset: number) {
      setOffsetLeft((prev) => (prev !== newOffset ? newOffset : prev));
   }
   function setCurrentPositionIfChanged(newPos: typeof currentPosition) {
      setCurrentPosition((prev) => {
         if (!prev && !newPos) return prev;
         if (!prev || !newPos) return newPos;
         if (prev.parentId !== newPos.parentId || prev.overId !== newPos.overId) return newPos;
         return prev;
      });
   }

   // Update drag handlers to use the new setters
   function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
      setActiveIdIfChanged(activeId);
      setOverIdIfChanged(activeId);

      const activeItem = flattenedItems.find(({ id }) => id === activeId);

      if (activeItem) {
         setCurrentPositionIfChanged({
            parentId: activeItem.parentId,
            overId: activeId,
         });
      }

      if (CAN_USE_DOM) {
         document.body.style.setProperty("cursor", "grabbing");
         document.body.classList.add("dragging");
      }
   }

   function handleDragMove({ delta }: DragMoveEvent) {
      setOffsetLeftIfChanged(delta.x);
   }

   function handleDragOver({ over }: DragOverEvent) {
      setOverIdIfChanged(over?.id ?? null);
   }

   function handleDragEnd({ active, over }: DragEndEvent) {
      try {
         resetState();

         if (projected && over) {
            // Find the original item
            const originalItem = flattenedItems.find((item) => item.id === active.id);
            // If no move: same parent and same index
            if (
               originalItem &&
               originalItem.parentId === projected.parentId &&
               originalItem.depth === projected.depth &&
               active.id === over.id
            ) {
               // No move, do nothing
               return;
            }

            const { depth, parentId } = projected;
            if (depth >= MAX_TREE_DEPTH) {
               showToast(`Maximum nesting depth (${MAX_TREE_DEPTH}) reached.`, "error", {
                  description: `You cannot nest items deeper than ${MAX_TREE_DEPTH} levels.`,
               });
               return;
            }
            reorderItems(active.id as string, over.id as string, parentId as string | null, depth);
         }
      } catch (error) {
         console.error("Error during drag operation:", error);
         showToast("Failed to reorder items", "error");
      }
   }

   function handleDragCancel() {
      resetState();
   }

   function resetState() {
      setOverIdIfChanged(null);
      setActiveIdIfChanged(null);
      setOffsetLeftIfChanged(0);
      setCurrentPositionIfChanged(null);

      if (CAN_USE_DOM) {
         document.body.style.setProperty("cursor", "");
         document.body.classList.remove("dragging");
      }
   }

   function getMovementAnnouncement(eventName: string, activeId: UniqueIdentifier, overId?: UniqueIdentifier) {
      if (overId && projected) {
         if (eventName !== "onDragEnd") {
            if (currentPosition && projected.parentId === currentPosition.parentId && overId === currentPosition.overId) {
               return;
            }
            setCurrentPosition({
               parentId: projected.parentId,
               overId,
            });
         }

         const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flattenTree(treeItems)));
         const overIndex = clonedItems.findIndex(({ id }) => id === overId);
         const activeIndex = clonedItems.findIndex(({ id }) => id === activeId);
         const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);

         const previousItem = sortedItems[overIndex - 1];

         let announcement: string | undefined;
         const movedVerb = eventName === "onDragEnd" ? "dropped" : "moved";
         const nestedVerb = eventName === "onDragEnd" ? "dropped" : "nested";

         if (!previousItem) {
            const nextItem = sortedItems[overIndex + 1];
            if (nextItem) {
               announcement = `${activeId} was ${movedVerb} before ${nextItem.id}.`;
            }
         } else {
            if (projected.depth > previousItem.depth) {
               announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`;
            } else {
               let previousSibling: FlattenedItem | undefined = previousItem;
               while (previousSibling && projected.depth < previousSibling.depth) {
                  const parentId: UniqueIdentifier | null = previousSibling.parentId;
                  previousSibling = sortedItems.find(({ id }) => id === parentId);
               }

               if (previousSibling) {
                  announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`;
               }
            }
         }

         return announcement;
      }

      return;
   }
}

const adjustTranslate: Modifier = ({ transform }) => {
   return {
      ...transform,
      y: transform.y - 5,
   };
};
