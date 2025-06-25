"use client";

import { useQuery as useConvexQuery, useMutation } from "convex/react";
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

interface CommandKProps {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

// Group threads by time periods for CommandK
// Returns null if searching
import type { Thread } from "./threads/types";

type TimeGroup = {
   name: string;
   threads: Thread[];
};

function groupThreadsByDate(threads: Thread[], searchQuery: string): TimeGroup[] | null {
   if (searchQuery) return null; // Don't group when searching

   const now = new Date();
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
   const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
   const monthAgo = today - 30 * 24 * 60 * 60 * 1000;
   const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

   const todayThreads: Thread[] = [];
   const last7DaysThreads: Thread[] = [];
   const last30DaysThreads: Thread[] = [];
   const thisYearThreads: Thread[] = [];
   const olderThreads: Record<number, Thread[]> = {};

   threads.forEach((thread) => {
      // If projectId exists, skip (for general chat grouping)
      if ((thread as any).projectId) return;
      const ts = (thread as any).updatedAt ?? thread.createdAt;
      if (!ts) {
         todayThreads.push(thread);
         return;
      }
      if (ts >= today) {
         todayThreads.push(thread);
      } else if (ts >= weekAgo) {
         last7DaysThreads.push(thread);
      } else if (ts >= monthAgo) {
         last30DaysThreads.push(thread);
      } else if (ts >= yearStart) {
         thisYearThreads.push(thread);
      } else {
         const year = new Date(ts).getFullYear();
         if (!olderThreads[year]) olderThreads[year] = [];
         olderThreads[year].push(thread);
      }
   });

   // Sort threads in each group by updatedAt/createdAt DESC
   const sortDesc = (a: Thread, b: Thread) => ((b as any).updatedAt ?? b.createdAt) - ((a as any).updatedAt ?? a.createdAt);

   const result: TimeGroup[] = [];
   if (todayThreads.length > 0) result.push({ name: "Today", threads: todayThreads.sort(sortDesc) });
   if (last7DaysThreads.length > 0) result.push({ name: "Last 7 days", threads: last7DaysThreads.sort(sortDesc) });
   if (last30DaysThreads.length > 0) result.push({ name: "Last 30 days", threads: last30DaysThreads.sort(sortDesc) });
   if (thisYearThreads.length > 0) result.push({ name: "This year", threads: thisYearThreads.sort(sortDesc) });
   Object.entries(olderThreads)
      .sort(([a], [b]) => Number(b) - Number(a))
      .forEach(([year, threads]) => {
         result.push({ name: year, threads: threads.sort(sortDesc) });
      });
   return result;
}

export function CommandK({ open: controlledOpen, onOpenChange }: CommandKProps = {}) {
   const [internalOpen, setInternalOpen] = useState(false);
   const [query, setQuery] = useState("");
   const [debouncedQuery, setDebouncedQuery] = useState("");
   const { data: session, isPending } = useSession();
   const commandRef = useRef<HTMLDivElement>(null);
   const set_ir_sidebar_state = useSandStateStore((s) => s.set_ir_sidebar_state);
   const deleteThreadMutation = useMutation(api.threads.deleteThread);
   const renameThreadMutation = useMutation(api.threads.renameThread);

   // --- New state for edit/delete modes ---
   const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
   const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
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
      api.threads.searchUserThreads,
      session?.user?.id
         ? {
              query: debouncedQuery,
              paginationOpts: { numItems: 10, cursor: null },
           }
         : "skip"
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

   const threads = useMemo(() => {
      if (!searchResults || "error" in searchResults) return [];
      return searchResults.page || [];
   }, [searchResults]);

   // Group threads by date unless searching
   const groupedThreads = useMemo(() => groupThreadsByDate(threads, query), [threads, query]);

   const handleSelect = (threadId: string) => {
      setOpen(false);
      setQuery("");
      // Reset all chat state for the new thread (prevents carryover bugs)
      useChatStore.getState().resetForThread(threadId);
      // router.navigate({ to: "/thread/$threadId", params: { threadId } });
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && query.trim() === "") {
         const selectedItem = commandRef.current?.querySelector('[data-selected="true"]');
         if (selectedItem) {
            return;
         }
         e.preventDefault();
         // setOpen(false);
         setQuery("");
         set_ir_sidebar_state(true);
         document.dispatchEvent(new CustomEvent("new_chat"));
         setOpen(false);
         // router.navigate({ to: "/" });
      }
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

   // --- Handlers for edit/delete ---
   const handleEditThread = (e: React.MouseEvent, threadId: string, currentTitle: string) => {
      e.stopPropagation();
      if (deletingThreadId === threadId) return; // Don't allow edit if deleting
      setEditingThreadId(threadId);
      setEditingTitle(currentTitle || "");
   };
   const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingThreadId(null);
      setEditingTitle("");
   };
   const handleSaveEdit = async (e: React.MouseEvent | React.KeyboardEvent, threadId: string) => {
      e.stopPropagation();
      if (!editingTitle.trim()) return; // Optionally show error
      await renameThreadMutation({ threadId: threadId as Id<"threads">, title: editingTitle.trim() });
      setEditingThreadId(null);
      setEditingTitle("");
   };
   const handleEditKeyDown = (e: React.KeyboardEvent, threadId: string) => {
      if (e.key === "Enter") handleSaveEdit(e, threadId);
      if (e.key === "Escape") handleCancelEdit(e as any);
   };
   const handleDeleteThread = (e: React.MouseEvent, threadId: string) => {
      e.stopPropagation();
      setDeletingThreadId(threadId);
   };
   const handleCancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingThreadId(null);
   };
   const handleConfirmDelete = async (e: React.MouseEvent, threadId: string) => {
      e.stopPropagation();
      await deleteThreadMutation({ threadId: threadId as Id<"threads"> });
      setDeletingThreadId(null);
      // Optionally: reset selection if deleted thread was open
   };

   // --- Render thread item with edit/delete UI ---
   const renderThreadItem = (thread: Thread) => {
      const isDeleting = deletingThreadId === thread._id;
      const isEditing = editingThreadId === thread._id;
      const displayTitle = thread.title || "Untitled Conversation";
      return (
         <CommandItem
            key={thread._id}
            value={thread._id}
            onSelect={() => !isDeleting && !isEditing && handleSelect(thread._id)}
            className={[
               "h-9 hover:bg-accent/80 flex items-center justify-between gap-4",
               isDeleting ? "bg-destructive/10 border border-destructive/20" : "",
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
                     onKeyDown={(e) => handleEditKeyDown(e, thread._id)}
                     onClick={(e) => e.stopPropagation()}
                     className="w-full bg-transparent border-none outline-none text-sm"
                     placeholder="Enter title..."
                     maxLength={100}
                  />
               ) : (
                  <span className={isDeleting ? "text-foreground/70" : "truncate font-medium"}>
                     {isDeleting ? `Delete "${displayTitle}"?` : displayTitle}
                  </span>
               )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
               {isDeleting ? (
                  <>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleConfirmDelete(e, thread._id)}
                        aria-label="Confirm delete"
                     >
                        <Check className="h-4 w-4" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={handleCancelDelete}
                        aria-label="Cancel delete"
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
                        onClick={(e) => handleSaveEdit(e, thread._id)}
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
                        {formatRelativeTime((thread as any).updatedAt ?? thread.createdAt)}
                     </span>
                     <div className="flex items-center gap-1">
                        <Button
                           variant="ghost"
                           size="icon"
                           className="transition-colors hover:text-blue-600 h-7 w-7"
                           onClick={(e) => handleEditThread(e, thread._id, thread.title)}
                           aria-label={`Edit title of ${displayTitle}`}
                        >
                           <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="transition-colors hover:text-destructive h-7 w-7"
                           onClick={(e) => handleDeleteThread(e, thread._id)}
                           aria-label={`Delete ${displayTitle}`}
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

   if (!session?.user?.id) {
      return null;
   }

   return (
      <CommandDialog open={open} onOpenChange={setOpen} className="top-[30%] translate-y-0">
         <Command ref={commandRef} shouldFilter={false} disablePointerSelection value={"-"}>
            <CommandInput
               placeholder="Search chats or press Enter to start a new chat..."
               value={query}
               onValueChange={setQuery}
               onKeyDown={handleKeyDown}
            />
            <CommandList>
               {isPending || searchResults === undefined ? (
                  <div className="flex items-center justify-center py-8">
                     <DotsLoader size="md" />
                  </div>
               ) : (
                  <>
                     <CommandEmpty>No chats found.</CommandEmpty>
                     {groupedThreads
                        ? groupedThreads.map((group) => (
                             <CommandGroup key={group.name} heading={group.name}>
                                {group.threads.map((thread) => renderThreadItem(thread))}
                             </CommandGroup>
                          ))
                        : threads.length > 0 && (
                             <CommandGroup heading="Chats">{threads.map((thread: Thread) => renderThreadItem(thread))}</CommandGroup>
                          )}
                  </>
               )}
            </CommandList>
         </Command>
      </CommandDialog>
   );
}
