// File: TreeItem.tsx
// Purpose: Renders a single tree item (document or folder) in the document tree, with drag-and-drop, options, and actions. Integrates with the document store for metadata.

import React, { forwardRef, type HTMLAttributes, memo, useState, useRef, useEffect, useDeferredValue } from "react";
import { FolderIcon, FolderOpenIcon, ChevronRight, ChevronDown, FilePen, Loader2, Check, FolderCogIcon } from "lucide-react";
import { ItemOptions } from "../Item/components/ItemOptions/ItemOptions";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { Add } from "../Item/components/Add/Add";
import { type UniqueIdentifier } from "@dnd-kit/core";
import { useParams, useNavigate, useLocation } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@docsurf/ui/components/popover";
import { useForm } from "@tanstack/react-form";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { cn } from "@docsurf/ui/lib/utils";
import { Route as MainDocDocumentIdRoute } from "@/routes/_main/doc.$documentId";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { Input } from "@docsurf/ui/components/input";
import { Button } from "@docsurf/ui/components/button";

/**
 * TreeItem component renders a single document or folder in the tree view.
 * Handles navigation, drag-and-drop, and contextual actions (rename, delete, etc).
 * Fetches document metadata from the tree store for options popover.
 */
export interface Props extends Omit<HTMLAttributes<HTMLLIElement>, "id"> {
   childCount?: number;
   clone?: boolean;
   collapsed?: boolean;
   depth: number;
   disableInteraction?: boolean;
   disableSelection?: boolean;
   ghost?: boolean;
   handleProps?: any;
   indicator?: boolean;
   indentationWidth: number;
   value: string;
   title?: string;
   isFolder?: boolean;
   isDraggingOver?: boolean;
   onCollapse?: (id: UniqueIdentifier) => void;
   onRemove?: (id: UniqueIdentifier) => void;
   onAddChild?(): void;
   wrapperRef?(node: HTMLLIElement): void;
   isLoading?: boolean;
   isEmptyFolder?: boolean;
   created_at?: string;
   updatedAt?: string;
}

export const TreeItem = memo(
   forwardRef<HTMLDivElement, Props>(
      (
         {
            childCount,
            clone,
            depth,
            disableSelection,
            disableInteraction,
            ghost,
            handleProps,
            indentationWidth,
            indicator,
            collapsed,
            onCollapse = () => {},
            onRemove = () => {},
            onAddChild = () => {},
            style,
            value,
            title,
            isFolder,
            isDraggingOver,
            wrapperRef,
            isLoading,
            isEmptyFolder,
            created_at,
            updatedAt,
            ...props
         },
         ref
      ) => {
         const isMobile = useIsMobile();
         const navigate = useNavigate();
         const pathname = useLocation({ select: (loc) => loc.pathname });
         const params = useParams({ strict: false });
         const isDocPage = pathname.startsWith("/doc");
         const isDocDetailPage = isDocPage && params.documentId;
         const isActive = !isFolder && isDocDetailPage && params.documentId === value;
         const user = useQuery(api.auth.getCurrentUser, {});
         const workspaceId = user?.workspaces?.[0]?.workspace?._id;
         const renameDocument = useMutation(api.documents.renameDocument).withOptimisticUpdate((localStore, args) => {
            // Optimistically update the document tree
            const tree = localStore.getQuery(api.documents.fetchDocumentTree, {
               workspaceId: args.workspaceId,
            });
            if (tree && Array.isArray(tree.data)) {
               localStore.setQuery(
                  api.documents.fetchDocumentTree,
                  { workspaceId: args.workspaceId },
                  {
                     data: tree.data.map((doc) => (doc._id === args.id ? { ...doc, title: args.title } : doc)),
                  }
               );
            }
            // Optimistically update the individual document if loaded
            const doc = localStore.getQuery(api.documents.fetchDocumentById, {
               workspaceId: args.workspaceId,
               id: args.id,
            });
            if (doc) {
               localStore.setQuery(
                  api.documents.fetchDocumentById,
                  { workspaceId: args.workspaceId, id: args.id },
                  { ...doc, title: args.title }
               );
            }
         });
         const [isRenameOpen, setIsRenameOpen] = useState(false);
         const [isOptionsOpen, setIsOptionsOpen] = useState(false);
         const inputRef = useRef<HTMLInputElement>(null);
         const [isRenaming, setIsRenaming] = useState(false);
         const valueProp = value;
         const [liveTitle, setLiveTitle] = useState(title);

         // TanStack React Form for renaming
         const form = useForm({
            defaultValues: { title: title ?? valueProp },
            onSubmit: async ({ value }) => {
               if (!workspaceId) {
                  showToast("Workspace not found", "error");
                  return;
               }
               setIsRenaming(true);
               try {
                  await renameDocument({
                     workspaceId: workspaceId as Id<"workspaces">,
                     id: valueProp as Id<"documents">,
                     title: value.title,
                  });
                  showToast("Renamed successfully", "success");
                  setIsRenameOpen(false);
               } catch (err: unknown) {
                  const errorMsg = err instanceof Error ? err.message : "Rename failed";
                  showToast(errorMsg, "error");
               } finally {
                  setIsRenaming(false);
               }
            },
         });

         const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
            if (event.key === "Enter") {
               if (onCollapse && isFolder) {
                  onCollapse(value as UniqueIdentifier);
               } else if (!isFolder) {
                  navigate({ to: `/doc/${value}` });
               }
            }
         };

         const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
            // Don't navigate if we're dragging or if it's a clone
            if (ghost || clone) return;

            // Check if the click is on the drag handle
            const target = event.target as HTMLElement;
            if (target.closest("[data-dnd-handle]")) return;

            // Check if we're in a drag operation
            if (document.body.classList.contains("dragging")) return;

            if (isFolder && onCollapse) {
               onCollapse(value as UniqueIdentifier);
            } else if (!isFolder) {
               navigate({ to: `/doc/${value}` });
            }
         };

         const handleRemove = () => {
            if (onRemove) {
               onRemove(value as UniqueIdentifier);
            }
         };

         const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (onAddChild) {
               onAddChild();
            }
         };

         // Auto-select text when popover opens
         useEffect(() => {
            if (isRenameOpen && inputRef.current) {
               inputRef.current.focus();
               inputRef.current.select();
            }
         }, [isRenameOpen]);

         // When title changes from outside, clear pending title if not editing
         useEffect(() => {
            if (!isRenameOpen) {
               form.reset({ title: title ?? value });
            }
         }, [isRenameOpen, form, title, value]);

         useEffect(() => {
            if (isRenaming) {
               form.reset({ title: title ?? value });
            }
         }, [isRenaming, form, title, value]);

         useEffect(() => {
            if (isRenameOpen) setLiveTitle(form.state.values.title);
         }, [isRenameOpen, form.state.values.title]);

         const icon = (
            <>
               {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground size-5 md:size-4" />
               ) : isFolder ? (
                  collapsed ? (
                     <ChevronRight className="h-4 w-4 size-5 md:size-4" />
                  ) : (
                     <ChevronDown className="h-4 w-4 size-5 md:size-4" />
                  )
               ) : (
                  <FilePen className="h-4 w-4 size-5 md:size-4" />
               )}
            </>
         );

         // Only wrap the clickable area for documents (not folders) with Link
         const clickableContent = (
            <div
               className={cn(
                  "group/item relative flex items-center h-7.5 rounded-sm  hover:bg-accent dark:hover:bg-accent/70 hover:text-muted-foreground cursor-pointer",
                  isActive && !ghost && "bg-accent dark:bg-accent/70",
                  clone ? "shadow-lg bg-white border border-gray-200 w-fit min-w-[200px]" : "w-full",
                  "transition-all duration-160 ease-in-out",
                  indicator && ghost && "h-[2px] border-none p-0 my-[5px] bg-primary/70",
                  !clone &&
                     !ghost &&
                     !indicator && [
                        "hover:bg-gray-200/50 hover:shadow-sm",
                        isDraggingOver && "bg-primary/50",
                        isActive && "bg-muted shadow-sm",
                     ]
               )}
               ref={isFolder ? ref : undefined}
               style={indicator ? { position: "relative", top: "-2px" } : undefined}
            >
               {indicator && ghost ? (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full border border-primary/70 bg-white" />
               ) : (
                  <>
                     <div className="pl-2 flex items-center min-w-0 flex-1">
                        <div className="flex items-center shrink-0 gap-1.5 relative">
                           {!isMobile && isFolder && onCollapse ? (
                              <>
                                 <button
                                    type="button"
                                    onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       onCollapse(value as UniqueIdentifier);
                                    }}
                                    className={cn(
                                       "p-0.5 rounded-sm hover:bg-muted",
                                       "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                       "cursor-pointer z-10 absolute left-0 opacity-0 group-hover/item:opacity-100"
                                    )}
                                 >
                                    {icon}
                                 </button>
                                 <div className={cn("transition-opacity duration-50 ease-in", "group-hover/item:opacity-0")}>
                                    {isFolder ? (
                                       collapsed ? (
                                          <FolderCogIcon className={cn("size-5 md:size-4", isDraggingOver ? "text-primary" : "")} />
                                       ) : (
                                          <FolderOpenIcon className={cn("size-5 md:size-4", isDraggingOver ? "text-primary" : "")} />
                                       )
                                    ) : (
                                       <FilePen className={cn("size-5 md:size-4", ghost ? "text-primary" : "text-gray-500")} />
                                    )}
                                 </div>
                              </>
                           ) : // Only render the icon inside the button on mobile, not again outside
                           isMobile ? (
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCollapse(value as UniqueIdentifier);
                                 }}
                                 className={cn(
                                    "p-0.5 rounded-sm hover:bg-muted",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                    "cursor-pointer z-10",
                                    collapsed && "transform"
                                 )}
                              >
                                 {icon}
                              </button>
                           ) : isFolder ? (
                              collapsed ? (
                                 <FolderCogIcon className={cn("size-5 md:size-4", isDraggingOver ? "text-primary" : "")} />
                              ) : (
                                 <FolderOpenIcon className={cn("size-5 md:size-4", isDraggingOver ? "text-primary" : "")} />
                              )
                           ) : (
                              <FilePen className={cn("size-5 md:size-4", ghost ? "text-gray-500" : "")} />
                           )}
                        </div>
                        <Popover open={isRenameOpen} onOpenChange={setIsRenameOpen} modal>
                           <PopoverTrigger asChild onClick={(e) => e.preventDefault()}>
                              <span
                                 className={cn(
                                    "ml-2 truncate select-none md:text-sm text-base font-medium",
                                    clone || ghost ? "text-gray-500" : undefined,
                                    !isMobile && "group-hover/item:pr-14"
                                 )}
                              >
                                 {isRenameOpen ? liveTitle : title}
                              </span>
                           </PopoverTrigger>
                           <PopoverContent
                              className="w-64 bg-background border border-input rounded-sm p-1 flex items-center gap-2 shadow-lg"
                              side="bottom"
                              align="start"
                              sideOffset={-5}
                           >
                              <form
                                 className="flex gap-2 items-center w-full"
                                 onSubmit={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    form.handleSubmit(e);
                                 }}
                              >
                                 <form.Field name="title">
                                    {(field) => (
                                       <Input
                                          ref={inputRef}
                                          id={field.name}
                                          name={field.name}
                                          value={field.state.value}
                                          onBlur={field.handleBlur}
                                          onChange={(e) => {
                                             field.handleChange(e.target.value);
                                             setLiveTitle(e.target.value);
                                          }}
                                          placeholder="Enter new name"
                                          autoComplete="off"
                                          onKeyDown={(e) => {
                                             if (e.key === "Escape") setIsRenameOpen(false);
                                             if (e.key === "Enter") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                form.handleSubmit();
                                             }
                                          }}
                                          disabled={isRenaming}
                                          className="flex h-8 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                       />
                                    )}
                                 </form.Field>
                                 <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                                    {([canSubmit, isSubmitting]) => (
                                       <Button
                                          type="submit"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex cursor-pointer items-center relative gap-2 font-semibold justify-center whitespace-nowrap rounded-sm text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary-hover h-7 w-7 flex-shrink-0"
                                          disabled={!canSubmit || isSubmitting || isRenaming}
                                       >
                                          {isSubmitting || isRenaming ? (
                                             <Loader2 className="size-4 animate-spin" />
                                          ) : (
                                             <Check className="size-4" />
                                          )}
                                       </Button>
                                    )}
                                 </form.Subscribe>
                              </form>
                           </PopoverContent>
                        </Popover>
                     </div>
                     <div
                        className={cn(
                           "flex items-center gap-0.5 shrink-0",
                           !isMobile &&
                              !clone && [
                                 "absolute right-2",
                                 "opacity-0 group-hover/item:opacity-100",
                                 "pointer-events-none group-hover/item:pointer-events-auto",
                              ]
                        )}
                     >
                        {!clone && isFolder && <Add onAddChild={onAddChild} />}
                        {!clone && (
                           <ItemOptions
                              className="z-10"
                              onRemove={handleRemove}
                              uuid={value}
                              created_at={created_at}
                              updatedAt={updatedAt}
                              onRename={() => {
                                 setIsRenameOpen(true);
                                 setIsOptionsOpen(false);
                              }}
                           />
                        )}
                     </div>
                     {clone && childCount && childCount > 1 ? (
                        <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-[11px] font-medium text-white">
                           {childCount}
                        </span>
                     ) : null}
                  </>
               )}
            </div>
         );

         return (
            <li
               className={cn(
                  "list-none box-border w-full cursor-pointer",
                  "duration-200 ease-in-out",
                  clone && "inline-block pointer-events-none p-0 pl-2.5 pt-1.5",
                  ghost && indicator && "opacity-100 relative z-10",
                  ghost && !indicator && "opacity-50",
                  disableSelection && "select-none",
                  disableInteraction && "pointer-events-none",
                  !clone && "overflow-hidden"
               )}
               ref={wrapperRef}
               style={{
                  paddingLeft: `${indentationWidth * depth}px`,
                  ...style,
                  backgroundColor: isDraggingOver ? "rgba(0, 0, 0, 0.08)" : undefined,
               }}
               {...handleProps}
               {...props}
               onKeyDown={handleKeyDown}
               onClick={handleClick}
            >
               {isFolder ? (
                  clickableContent
               ) : (
                  <Link
                     to={MainDocDocumentIdRoute.to}
                     params={{ documentId: value }}
                     tabIndex={0}
                     className="block w-full h-full"
                     ref={ref as React.Ref<HTMLAnchorElement>}
                  >
                     {clickableContent}
                  </Link>
               )}
               {isFolder && !collapsed && isEmptyFolder && !clone && (
                  <div
                     className="text-xs text-muted-foreground italic pl-8 py-1"
                     style={{ paddingLeft: `${indentationWidth * (depth + 1)}px` }}
                  >
                     This folder is empty
                  </div>
               )}
            </li>
         );
      }
   )
);
