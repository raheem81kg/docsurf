import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@docsurf/ui/lib/utils";
import { CommandP } from "./commandpchats";
import { Popover, PopoverTrigger, PopoverContent } from "@docsurf/ui/components/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@docsurf/ui/components/tooltip";
import { useSandStateStore } from "@/store/sandstate";

/**
 * ChatHeader - Header for the chat panel with New Chat and Search Chats buttons.
 * Consistent with sidebar header styling.
 */
export function ChatHeader({ className }: { className?: string }) {
   const [commandPOpen, setCommandPOpen] = useState(false);
   const set_ir_sidebar_state = useSandStateStore((s) => s.set_ir_sidebar_state);
   return (
      <div className={cn("flex pointer-events-auto items-center justify-between gap-2 px-3 py-2", className)}>
         <div className="flex items-center gap-2 md:gap-1.5">
            <Popover>
               <PopoverTrigger asChild>
                  <Tooltip delayDuration={0}>
                     <TooltipTrigger asChild>
                        <button
                           type="button"
                           className="hover:bg-accent/50 rounded-md p-1"
                           onClick={() => {
                              document.dispatchEvent(new CustomEvent("new_chat"));
                           }}
                        >
                           <Plus className="size-5 md:size-4" />
                        </button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">New Chat</TooltipContent>
                  </Tooltip>
               </PopoverTrigger>
               <PopoverContent side="bottom" align="center">
                  <span className="text-sm">Start a new chat</span>
               </PopoverContent>
            </Popover>
            <Popover>
               <PopoverTrigger asChild>
                  <Tooltip delayDuration={0}>
                     <TooltipTrigger asChild>
                        <button
                           type="button"
                           className="hover:bg-accent/50 rounded-md p-1"
                           onClick={() => {
                              setCommandPOpen(true);
                           }}
                        >
                           <Search className="size-5 md:size-4" />
                        </button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">Search Chats</TooltipContent>
                  </Tooltip>
               </PopoverTrigger>
               <PopoverContent side="bottom" align="center">
                  <span className="text-sm">Search your chats</span>
               </PopoverContent>
            </Popover>
            <CommandP open={commandPOpen} onOpenChange={setCommandPOpen} />
         </div>
         <Popover>
            <PopoverTrigger asChild>
               <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                     <button
                        type="button"
                        className="hover:bg-accent/50 rounded-md p-1"
                        onClick={() => {
                           set_ir_sidebar_state(false);
                        }}
                     >
                        <X className="size-5 md:size-4" />
                     </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Close Chat</TooltipContent>
               </Tooltip>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="center">
               <span className="text-sm">Close Chat</span>
            </PopoverContent>
         </Popover>
      </div>
   );
}
