"use client";

import { useMutation, useQuery as useConvexQuery } from "convex/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useEffect, useMemo, useRef, useState } from "react";

import {
   Command,
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@docsurf/ui/components/command";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useSession } from "@/hooks/auth-hooks";
import { useChatStore } from "./lib/chat-store";
import { DotsLoader } from "@docsurf/ui/components/loader";
import { Button } from "@docsurf/ui/components/button";
import { Pencil, Trash, Check, X } from "lucide-react";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";
import { useSandStateStore } from "@/store/sandstate";
import { convexQuery } from "@convex-dev/react-query";
import { DEFAULT_TEXT_TITLE } from "@/utils/constants";
import throttle from "lodash/throttle";
import { useNavigate } from "@tanstack/react-router";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";

interface CommandKProps {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

export function CommandK({ open: controlledOpen, onOpenChange }: CommandKProps = {}) {
   const [internalOpen, setInternalOpen] = useState(false);
   const [query, setQuery] = useState("");
   const [debouncedQuery, setDebouncedQuery] = useState("");
   const { data: session, isPending } = useSession();
   const commandRef = useRef<HTMLDivElement>(null);
   const set_ir_sidebar_state = useSandStateStore((s) => s.set_ir_sidebar_state);

   // Only allow queries when session is loaded and user is authenticated
   const isAuthenticated = !isPending && !!session?.user;

   const user = useQuery({
      ...convexQuery(api.auth.getCurrentUser, {}),
      enabled: isAuthenticated,
   });
   const navigate = useNavigate();
   const createDocument = useMutation(api.documents.createDocument);
   const queryClient = useQueryClient();

   const workspaceId = user?.data?.workspaces?.[0]?.workspace?._id as Id<"workspaces"> | undefined;
   const moveToTrash = useMutation(api.documents.moveDocumentToTrash);
   const renameDocument = useMutation(api.documents.renameDocument);
   const [trashingDocId, setTrashingDocId] = useState<string | null>(null);
   const [editingDocId, setEditingDocId] = useState<string | null>(null);
   const [editingTitle, setEditingTitle] = useState("");

   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedQuery(query);
      }, 320);

      return () => clearTimeout(timer);
   }, [query]);

   const searchResults = useConvexQuery(
      api.documents.searchDocuments,
      workspaceId && isAuthenticated ? { workspaceId, query: debouncedQuery } : "skip"
   );

   useEffect(() => {
      const down = (e: KeyboardEvent) => {
         if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setOpen(!open);
         }
      };

      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
   }, [open, setOpen]);

   const documents = useMemo(() => {
      if (!searchResults || "error" in searchResults) return [];
      return searchResults;
   }, [searchResults]);

   const groupDocumentsByDate = (docs: any[], searchQuery: string) => {
      if (searchQuery) return null;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
      const monthAgo = today - 30 * 24 * 60 * 60 * 1000;
      const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
      const todayDocs: any[] = [];
      const last7DaysDocs: any[] = [];
      const last30DaysDocs: any[] = [];
      const thisYearDocs: any[] = [];
      const olderDocs: Record<number, any[]> = {};
      docs.forEach((doc) => {
         const ts = doc.updatedAt ?? doc._creationTime;
         if (!ts) {
            todayDocs.push(doc);
            return;
         }
         if (ts >= today) {
            todayDocs.push(doc);
         } else if (ts >= weekAgo) {
            last7DaysDocs.push(doc);
         } else if (ts >= monthAgo) {
            last30DaysDocs.push(doc);
         } else if (ts >= yearStart) {
            thisYearDocs.push(doc);
         } else {
            const year = new Date(ts).getFullYear();
            if (!olderDocs[year]) olderDocs[year] = [];
            olderDocs[year].push(doc);
         }
      });
      const sortDesc = (a: any, b: any) => (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime);
      const result: any[] = [];
      if (todayDocs.length > 0) result.push({ name: "Today", docs: todayDocs.sort(sortDesc) });
      if (last7DaysDocs.length > 0) result.push({ name: "Last 7 days", docs: last7DaysDocs.sort(sortDesc) });
      if (last30DaysDocs.length > 0) result.push({ name: "Last 30 days", docs: last30DaysDocs.sort(sortDesc) });
      if (thisYearDocs.length > 0) result.push({ name: "This year", docs: thisYearDocs.sort(sortDesc) });
      Object.entries(olderDocs)
         .sort(([a], [b]) => Number(b) - Number(a))
         .forEach(([year, docs]) => {
            result.push({ name: year, docs: docs.sort(sortDesc) });
         });
      return result;
   };

   const groupedDocs = useMemo(() => groupDocumentsByDate(documents, query), [documents, query]);

   const handleSelect = (docId: string) => {
      setOpen(false);
      setQuery("");
      window.location.href = `/doc/${docId}`;
   };

   const handleEditDoc = (e: React.MouseEvent, docId: string, currentTitle: string) => {
      e.stopPropagation();
      if (trashingDocId === docId) return;
      setEditingDocId(docId);
      setEditingTitle(currentTitle || "");
   };

   const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingDocId(null);
      setEditingTitle("");
   };

   const handleSaveEdit = async (e: React.MouseEvent | React.KeyboardEvent, docId: string) => {
      e.stopPropagation();
      if (!editingTitle.trim() || !workspaceId) return;
      await renameDocument({ workspaceId, id: docId as Id<"documents">, title: editingTitle.trim() });
      setEditingDocId(null);
      setEditingTitle("");
      queryClient.invalidateQueries({ queryKey: ["fetchDocumentTree", { workspaceId }] });
   };

   const handleEditKeyDown = (e: React.KeyboardEvent, docId: string) => {
      if (e.key === "Enter") handleSaveEdit(e, docId);
      if (e.key === "Escape") handleCancelEdit(e as any);
   };

   const handleTrashDoc = (e: React.MouseEvent, docId: string) => {
      e.stopPropagation();
      setTrashingDocId(docId);
   };

   const handleCancelTrash = (e: React.MouseEvent) => {
      e.stopPropagation();
      setTrashingDocId(null);
   };

   const handleConfirmTrash = async (e: React.MouseEvent, docId: string) => {
      e.stopPropagation();
      if (!workspaceId) return;
      await moveToTrash({ workspaceId, id: docId as Id<"documents"> });
      setTrashingDocId(null);
   };

   const formatRelativeTime = (timestamp: number) => {
      try {
         const now = new Date();
         const date = new Date(timestamp);
         const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

         if (seconds < 5) {
            return "just now";
         }
         if (seconds < 60) {
            return `${seconds}s ago`;
         }

         const minutes = Math.floor(seconds / 60);
         if (minutes < 60) {
            return `${minutes}m ago`;
         }

         const hours = Math.floor(minutes / 60);
         if (hours < 24) {
            return `${hours}h ago`;
         }

         const days = Math.floor(hours / 24);
         if (days < 30) {
            return `${days}d ago`;
         }

         const months = Math.floor(days / 30);
         if (months < 12) {
            return `${months}mo ago`;
         }

         const years = Math.floor(days / 365);
         return `${years}y ago`;
      } catch {
         return null;
      }
   };

   const renderDocItem = (doc: any) => {
      const isTrashing = trashingDocId === doc._id;
      const isEditing = editingDocId === doc._id;
      const displayTitle = doc.title || "Untitled Document";
      return (
         <CommandItem
            key={doc._id}
            value={doc._id}
            onSelect={() => !isTrashing && !isEditing && handleSelect(doc._id)}
            className={[
               "h-9 hover:bg-accent/80 flex items-center justify-between gap-4",
               isTrashing ? "bg-destructive/10 border border-destructive/20" : "",
               isEditing ? "bg-muted/50 border border-muted-foreground/20" : "",
            ].join(" ")}
            disabled={false}
         >
            <div className="flex min-w-0 flex-1 items-center gap-2">
               {isEditing ? (
                  <input
                     type="text"
                     value={editingTitle}
                     onChange={(e) => setEditingTitle(e.target.value)}
                     onKeyDown={(e) => handleEditKeyDown(e, doc._id)}
                     onClick={(e) => e.stopPropagation()}
                     className="w-full bg-transparent border-none outline-none text-sm"
                     placeholder="Enter title..."
                     maxLength={100}
                  />
               ) : (
                  <span className={isTrashing ? "text-foreground/70" : "truncate font-medium"}>
                     {isTrashing ? `Trash "${displayTitle}"?` : displayTitle}
                  </span>
               )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
               {isTrashing ? (
                  <>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleConfirmTrash(e, doc._id)}
                        aria-label="Confirm trash"
                     >
                        <Check className="h-4 w-4" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={handleCancelTrash}
                        aria-label="Cancel trash"
                     >
                        <X className="h-4 w-4" />
                     </Button>
                  </>
               ) : isEditing ? (
                  <>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                        onClick={(e) => handleSaveEdit(e, doc._id)}
                        aria-label="Save title"
                     >
                        <Check className="h-4 w-4" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={handleCancelEdit}
                        aria-label="Cancel edit"
                     >
                        <X className="h-4 w-4" />
                     </Button>
                  </>
               ) : (
                  <>
                     <span className="text-xs text-muted-foreground whitespace-nowrap w-16 text-right">
                        {formatRelativeTime(doc.updatedAt ?? doc._creationTime)}
                     </span>
                     <div className="flex items-center gap-1">
                        <Button
                           variant="ghost"
                           size="icon"
                           className="transition-colors hover:text-blue-600 h-7 w-7"
                           onClick={(e) => handleEditDoc(e, doc._id, doc.title)}
                           aria-label={`Edit title of ${displayTitle}`}
                        >
                           <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="transition-colors hover:text-destructive h-7 w-7"
                           onClick={(e) => handleTrashDoc(e, doc._id)}
                           aria-label={`Trash ${displayTitle}`}
                        >
                           <Trash className="h-4 w-4" />
                        </Button>
                     </div>
                  </>
               )}
            </div>
         </CommandItem>
      );
   };

   const throttledCreate = throttle(
      async () => {
         if (!workspaceId) return;
         try {
            const doc = await createDocument({
               workspaceId,
               title: DEFAULT_TEXT_TITLE,
               documentType: "text/plain",
               parentId: undefined,
               orderPosition: -1,
            });
            navigate({ to: "/doc", params: { docId: doc.id } });
            setOpen(false);
         } catch (err) {
            // Optionally show a toast
         }
      },
      1000,
      { trailing: false }
   );

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && query.trim() === "") {
         throttledCreate();
      }
   };

   const isMobile = useIsMobile();

   if (!workspaceId) {
      return null;
   }

   return (
      <CommandDialog
         open={open}
         onOpenChange={setOpen}
         className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow-lg duration-200 overflow-hidden p-0 border-none sm:max-w-3xl bg-background/95 backdrop-blur-xl"
      >
         <Command ref={commandRef} shouldFilter={false} disablePointerSelection value={"-"}>
            <CommandInput
               placeholder={isMobile ? "Search documents" : "Search documents or press Enter to start a new document"}
               value={query}
               onValueChange={setQuery}
               onKeyDown={handleKeyDown}
            />
            <CommandList className="h-full max-h-[45vh]">
               {isPending || searchResults === undefined ? (
                  <div className="flex items-center justify-center py-8">
                     <DotsLoader size="md" />
                  </div>
               ) : (
                  <>
                     <CommandEmpty>No documents found.</CommandEmpty>
                     {groupedDocs
                        ? groupedDocs.map((group) => (
                             <CommandGroup key={group.name} heading={group.name}>
                                {group.docs.map((doc: any) => renderDocItem(doc))}
                             </CommandGroup>
                          ))
                        : documents.length > 0 && (
                             <CommandGroup heading="Documents">{documents.map((doc: any) => renderDocItem(doc))}</CommandGroup>
                          )}
                  </>
               )}
            </CommandList>
         </Command>
      </CommandDialog>
   );
}
