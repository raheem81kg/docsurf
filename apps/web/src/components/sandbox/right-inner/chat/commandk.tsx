"use client";

import { useRouter } from "@tanstack/react-router";
import { useQuery as useConvexQuery } from "convex/react";
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
   const router = useRouter();
   const commandRef = useRef<HTMLDivElement>(null);

   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedQuery(query);
      }, 300);

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
                                {group.threads.map((thread) => (
                                   <CommandItem
                                      key={thread._id}
                                      value={thread._id}
                                      onSelect={() => handleSelect(thread._id)}
                                      className="h-9 hover:bg-accent/80"
                                   >
                                      <div className="flex w-full items-center justify-between gap-4">
                                         <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <div className="truncate font-medium">{thread.title}</div>
                                         </div>
                                         <div className="flex-shrink-0 text-muted-foreground text-xs">
                                            {formatRelativeTime((thread as any).updatedAt ?? thread.createdAt)}
                                         </div>
                                      </div>
                                   </CommandItem>
                                ))}
                             </CommandGroup>
                          ))
                        : threads.length > 0 && (
                             <CommandGroup heading="Chats">
                                {threads.map((thread: Thread) => (
                                   <CommandItem
                                      key={thread._id}
                                      value={thread._id}
                                      onSelect={() => handleSelect(thread._id)}
                                      className="h-9 hover:bg-accent/80"
                                   >
                                      <div className="flex w-full items-center justify-between gap-4">
                                         <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <div className="truncate font-medium">{thread.title}</div>
                                         </div>
                                         <div className="flex-shrink-0 text-muted-foreground text-xs">
                                            {formatRelativeTime((thread as any).updatedAt ?? thread.createdAt)}
                                         </div>
                                      </div>
                                   </CommandItem>
                                ))}
                             </CommandGroup>
                          )}
                  </>
               )}
            </CommandList>
         </Command>
      </CommandDialog>
   );
}
