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

interface Thread {
   _id: string;
   title: string;
   createdAt: number;
   authorId: string;
}

interface CommandKProps {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
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
                     {threads.length > 0 && (
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
                                       {formatRelativeTime(thread.createdAt)}
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
