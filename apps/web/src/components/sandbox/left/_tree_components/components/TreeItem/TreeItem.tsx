// File: TreeItem.tsx
// Purpose: Renders a single tree item (document or folder) in the document tree, with drag-and-drop, options, and actions. Integrates with the document store for metadata.

import React, {
   forwardRef,
   type HTMLAttributes,
   useCallback,
   useMemo,
   memo,
   useState,
   useRef,
   useEffect,
   useDeferredValue,
} from "react";
import { FolderIcon, FolderOpenIcon, ChevronRight, ChevronDown, FilePen, Loader2, Check } from "lucide-react";
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
   updated_at?: string;
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
            onCollapse,
            onRemove,
            onAddChild,
            style,
            value,
            title,
            isFolder,
            isDraggingOver,
            wrapperRef,
            isLoading,
            isEmptyFolder,
            created_at,
            updated_at,
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
         const updateDocument = useMutation(api.documents.updateDocument);
         const [isRenameOpen, setIsRenameOpen] = useState(false);
         const [isOptionsOpen, setIsOptionsOpen] = useState(false);
         const inputRef = useRef<HTMLInputElement>(null);
         const [isRenaming, setIsRenaming] = useState(false);
         const uuid = value;

         // TanStack React Form for renaming
         const form = useForm({
            defaultValues: { title: title ?? value },
            onSubmit: async ({ value }) => {
               if (!workspaceId) {
                  showToast("Workspace not found", "error");
                  return;
               }
               setIsRenaming(true);
               try {
                  await updateDocument({
                     workspaceId: workspaceId as Id<"workspaces">,
                     id: params.documentId as Id<"documents">,
                     updates: { title: value.title },
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

         const handleKeyDown = useCallback(
            (event: React.KeyboardEvent<HTMLLIElement>) => {
               if (event.key === "Enter") {
                  if (onCollapse && isFolder) {
                     onCollapse(value as UniqueIdentifier);
                  } else if (!isFolder) {
                     navigate({ to: `/doc/${value}` });
                  }
               }
            },
            [onCollapse, value, isFolder, navigate]
         );

         const handleClick = useCallback(
            (event: React.MouseEvent<HTMLLIElement>) => {
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
            },
            [onCollapse, value, isFolder, navigate, ghost, clone]
         );

         const handleRemove = useCallback(() => {
            if (onRemove) {
               onRemove(value as UniqueIdentifier);
            }
         }, [onRemove, value]);

         const handleAdd = useCallback(
            (event: React.MouseEvent<HTMLButtonElement>) => {
               event.stopPropagation();
               if (onAddChild) {
                  onAddChild();
               }
            },
            [onAddChild]
         );

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

         const icon = useMemo(() => {
            if (isLoading) {
               return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
            }
            if (isFolder) {
               return collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
            }
            return <FilePen className="h-4 w-4" />;
         }, [isFolder, collapsed, isLoading]);

         const displayTitle = form.state.values.title;
         const deferredDisplayTitle = useDeferredValue(displayTitle);

         // Only wrap the clickable area for documents (not folders) with Link
         const clickableContent = (
            <div
               className={cn(
                  "group/item relative flex items-center h-7.5 px-2 rounded-sm  hover:bg-bg-subtle/90 dark:hover:bg-bg-subtle/70 hover:text-muted-foreground cursor-pointer",
                  isActive && !ghost && "bg-bg-subtle/90 dark:bg-bg-subtle/70",
                  clone ? "shadow-lg bg-white border border-gray-200 w-fit min-w-[200px]" : "w-full",
                  "transition-all duration-160 ease-in-out",
                  indicator && ghost && "h-[2px] border-none p-0 my-[5px] bg-blue-400/70",
                  !clone &&
                     !ghost &&
                     !indicator && [
                        "hover:bg-gray-200/50 hover:shadow-sm",
                        isDraggingOver && "bg-blue-50",
                        isActive && "bg-muted shadow-sm",
                     ]
               )}
               ref={isFolder ? ref : undefined}
               style={indicator ? { position: "relative", top: "-2px" } : undefined}
            >
               {indicator && ghost ? (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full border border-blue-400/70 bg-white" />
               ) : (
                  <>
                     <div className="flex items-center min-w-0 flex-1 overflow-hidden">
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
                                       "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                       "cursor-pointer z-10 absolute left-0 opacity-0 group-hover/item:opacity-100"
                                    )}
                                 >
                                    {icon}
                                 </button>
                                 <div className={cn("transition-opacity duration-50 ease-in", "group-hover/item:opacity-0")}>
                                    {isFolder ? (
                                       collapsed ? (
                                          <FolderIcon size={16} className={cn("size-4", isDraggingOver ? "text-blue-500" : "")} />
                                       ) : (
                                          <FolderOpenIcon size={16} className={cn("size-4", isDraggingOver ? "text-blue-500" : "")} />
                                       )
                                    ) : (
                                       <FilePen size={16} className={cn("size-4", ghost ? "text-blue-500" : "text-gray-500")} />
                                    )}
                                 </div>
                              </>
                           ) : (
                              <>
                                 {onCollapse && isMobile && (
                                    <button
                                       type="button"
                                       onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          onCollapse(value as UniqueIdentifier);
                                       }}
                                       className={cn(
                                          "p-0.5 rounded-sm hover:bg-muted",
                                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                          "cursor-pointer z-10",
                                          collapsed && "transform"
                                       )}
                                    >
                                       {icon}
                                    </button>
                                 )}
                                 {isFolder ? (
                                    collapsed ? (
                                       <FolderIcon size={16} className={cn("size-4", isDraggingOver ? "text-blue-500" : "")} />
                                    ) : (
                                       <FolderOpenIcon size={16} className={cn("size-4", isDraggingOver ? "text-blue-500" : "")} />
                                    )
                                 ) : (
                                    <FilePen size={16} className={cn("size-4", ghost ? "text-gray-500" : "")} />
                                 )}
                              </>
                           )}
                        </div>
                        <Popover open={isRenameOpen} onOpenChange={setIsRenameOpen} modal>
                           <PopoverTrigger asChild onClick={(e) => e.preventDefault()}>
                              <span
                                 className={cn(
                                    "ml-1.5 truncate select-none text-sm",
                                    clone || ghost ? "text-gray-500" : undefined,
                                    !isMobile && "group-hover/item:pr-14"
                                 )}
                              >
                                 {deferredDisplayTitle}
                              </span>
                           </PopoverTrigger>
                           <PopoverContent
                              className="w-64 bg-default border border-input rounded-sm p-1 flex items-center gap-2 shadow-lg"
                              side="bottom"
                              align="start"
                              sideOffset={-5}
                           >
                              <form
                                 className="flex gap-2 items-center w-full"
                                 onSubmit={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void form.handleSubmit();
                                 }}
                              >
                                 <form.Field name="title">
                                    {(field) => (
                                       <input
                                          ref={inputRef}
                                          value={field.state.value}
                                          onBlur={field.handleBlur}
                                          onChange={(e) => field.handleChange(e.target.value)}
                                          className="flex h-8 w-full rounded-sm border border-input bg-default px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                          placeholder="Enter new name"
                                          name="name"
                                          autoComplete="off"
                                          onClick={(e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                          }}
                                          onKeyDown={(e) => {
                                             if (e.key === "Escape") setIsRenameOpen(false);
                                          }}
                                          disabled={isRenaming}
                                       />
                                    )}
                                 </form.Field>
                                 <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                                    {([canSubmit, isSubmitting]) => (
                                       <button
                                          type="submit"
                                          className="inline-flex cursor-pointer items-center relative gap-2 font-semibold justify-center whitespace-nowrap rounded-sm text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary-hover h-7 w-7 flex-shrink-0"
                                          disabled={!canSubmit || isSubmitting || isRenaming}
                                       >
                                          {isSubmitting || isRenaming ? (
                                             <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                             <Check className="w-4 h-4" />
                                          )}
                                       </button>
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
                        {!clone && onAddChild && isFolder && <Add onAddChild={onAddChild} />}
                        {!clone && onRemove && (
                           <ItemOptions
                              className="z-10"
                              onRemove={handleRemove}
                              uuid={value}
                              created_at={created_at}
                              updated_at={updated_at}
                              onRename={() => {
                                 setIsRenameOpen(true);
                                 setIsOptionsOpen(false);
                              }}
                           />
                        )}
                     </div>
                     {clone && childCount && childCount > 1 ? (
                        <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-[11px] font-medium text-white">
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
