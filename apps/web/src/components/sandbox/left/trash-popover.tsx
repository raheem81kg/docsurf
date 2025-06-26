/**
 * TrashPopover - Sidebar popover for viewing and managing trashed documents.
 * Modeled after CommandK, with search, pagination, and loading states.
 */
import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@docsurf/ui/components/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@docsurf/ui/components/command";
import { api } from "@docsurf/backend/convex/_generated/api";
import { Button } from "@docsurf/ui/components/button";
import { Trash, RotateCcw, Check, X } from "lucide-react";
import { useQuery } from "convex/react";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { useConvex, useMutation } from "convex/react";
import throttle from "lodash/throttle";

// Document type based on backend schema

interface TrashPopoverProps {
   children: React.ReactNode;
}

interface Document {
   _id: Id<"documents">;
   title: string;
   updatedAt: number;
   documentType: string;
   // ...other fields as needed
}

export function TrashPopover({ children }: TrashPopoverProps) {
   const user = useQuery(api.auth.getCurrentUser, {});
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;
   const restoreDocument = useMutation(api.documents.restoreDocument);
   const deleteDocumentPermanently = useMutation(api.documents.deleteDocumentPermanently);
   const [confirmDeleteId, setConfirmDeleteId] = React.useState<Id<"documents"> | null>(null);
   const [actionLoadingId, setActionLoadingId] = React.useState<Id<"documents"> | null>(null);
   const [open, setOpen] = React.useState(false);
   // Search state
   const [query, setQuery] = React.useState("");
   const [debouncedQuery, setDebouncedQuery] = React.useState("");
   React.useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedQuery(query);
      }, 320);
      return () => clearTimeout(timer);
   }, [query]);
   React.useEffect(() => {
      if (!open) {
         setQuery("");
         setDebouncedQuery("");
         setConfirmDeleteId(null);
         setActionLoadingId(null);
      }
   }, [open]);

   // Throttle the open/close action to once every 1 second (1000ms)
   const throttledSetOpen = React.useMemo(() => throttle((value: boolean) => setOpen(value), 1000, { trailing: false }), []);

   return (
      <Popover open={open} onOpenChange={throttledSetOpen}>
         <PopoverTrigger asChild>{children}</PopoverTrigger>
         <PopoverContent side="right" align="start" alignOffset={-220} className="w-80 p-0">
            <Command shouldFilter={false} value={"-"}>
               <CommandInput placeholder="Search trashed documents..." value={query} onValueChange={setQuery} />
               <TrashedDocumentsList
                  workspaceId={workspaceId}
                  debouncedQuery={debouncedQuery}
                  confirmDeleteId={confirmDeleteId}
                  setConfirmDeleteId={setConfirmDeleteId}
                  actionLoadingId={actionLoadingId}
                  setActionLoadingId={setActionLoadingId}
                  restoreDocument={restoreDocument}
                  deleteDocumentPermanently={deleteDocumentPermanently}
               />
            </Command>
         </PopoverContent>
      </Popover>
   );
}

interface TrashedDocumentsListProps {
   workspaceId: Id<"workspaces"> | undefined;
   debouncedQuery: string;
   confirmDeleteId: Id<"documents"> | null;
   setConfirmDeleteId: React.Dispatch<React.SetStateAction<Id<"documents"> | null>>;
   actionLoadingId: Id<"documents"> | null;
   setActionLoadingId: React.Dispatch<React.SetStateAction<Id<"documents"> | null>>;
   restoreDocument: ReturnType<typeof useMutation<typeof api.documents.restoreDocument>>;
   deleteDocumentPermanently: ReturnType<typeof useMutation<typeof api.documents.deleteDocumentPermanently>>;
}

function TrashedDocumentsList({
   workspaceId,
   debouncedQuery,
   confirmDeleteId,
   setConfirmDeleteId,
   actionLoadingId,
   setActionLoadingId,
   restoreDocument,
   deleteDocumentPermanently,
}: TrashedDocumentsListProps) {
   const trashedDocs = useQuery(
      api.documents.fetchTrashedDocuments,
      workspaceId
         ? {
              workspaceId,
              query: debouncedQuery,
              paginationOpts: { numItems: 15, cursor: null },
           }
         : "skip"
   );
   const results = trashedDocs?.page || [];
   const isLoading = trashedDocs === undefined;
   return (
      <CommandList className="min-h-[200px]">
         {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
         ) : (
            <>
               <CommandEmpty>No deleted documents found.</CommandEmpty>
               {results.length > 0 && (
                  <CommandGroup heading="Trashed Documents">
                     {results.map((doc: Document) => {
                        const isConfirming = confirmDeleteId === doc._id;
                        const isActionLoading = actionLoadingId === doc._id;
                        return (
                           <CommandItem
                              key={doc._id}
                              value={doc._id}
                              className={[
                                 "h-9 hover:bg-accent/80 flex items-center justify-between gap-4",
                                 isConfirming ? "bg-destructive/10 border border-destructive/20" : "",
                              ].join(" ")}
                              disabled={false}
                           >
                              <span className={isConfirming ? "text-foreground/70" : "truncate font-medium"}>
                                 {isConfirming ? `Delete "${doc.title || "Untitled Document"}"?` : doc.title || "Untitled Document"}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                 {/* Restore button (only if not confirming delete) */}
                                 {!isConfirming && (
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="transition-colors hover:text-green-600 h-7 w-7"
                                       aria-label="Restore"
                                       disabled={isActionLoading || !workspaceId}
                                       onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!workspaceId) return;
                                          setActionLoadingId(doc._id);
                                          await restoreDocument({ workspaceId: workspaceId, documentId: doc._id });
                                          setActionLoadingId(null);
                                       }}
                                    >
                                       <RotateCcw className="h-4 w-4" />
                                    </Button>
                                 )}
                                 {/* Delete button with confirm mode */}
                                 {isConfirming ? (
                                    <>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                          aria-label="Confirm delete"
                                          disabled={isActionLoading || !workspaceId}
                                          onClick={async (e) => {
                                             e.stopPropagation();
                                             if (!workspaceId) return;
                                             setActionLoadingId(doc._id);
                                             await deleteDocumentPermanently({
                                                workspaceId: workspaceId,
                                                id: doc._id,
                                             });
                                             setActionLoadingId(null);
                                             setConfirmDeleteId(null);
                                          }}
                                       >
                                          <Check className="h-4 w-4" />
                                       </Button>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground"
                                          aria-label="Cancel delete"
                                          disabled={isActionLoading}
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setConfirmDeleteId(null);
                                          }}
                                       >
                                          <X className="h-4 w-4" />
                                       </Button>
                                    </>
                                 ) : (
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="transition-colors hover:text-destructive h-7 w-7"
                                       aria-label="Delete permanently"
                                       disabled={isActionLoading}
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteId(doc._id);
                                       }}
                                    >
                                       <Trash className="h-4 w-4" />
                                    </Button>
                                 )}
                              </div>
                           </CommandItem>
                        );
                     })}
                  </CommandGroup>
               )}
            </>
         )}
      </CommandList>
   );
}
