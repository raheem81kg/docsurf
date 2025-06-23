import { Button, buttonVariants } from "@docsurf/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { useSidebar } from "@docsurf/ui/components/sidebar";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@docsurf/ui/lib/utils";
import { CommandK } from "./commandk";
import { useSandStateStore } from "@/store/sandstate";

/**
 * ChatHeader - Header for the chat panel with New Chat and Search Chats buttons.
 * Consistent with sidebar header styling.
 */
export function ChatHeader() {
   //    const toggle_ir_sidebar = useSandStateStore((s) => s.toggle_ir_sidebar);

   const navigate = useNavigate();
   const { setOpenMobile } = useSidebar();
   const [commandKOpen, setCommandKOpen] = useState(false);

   return (
      <div className="flex pointer-events-auto items-center justify-between gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
         <Button
            className={cn(buttonVariants({ variant: "default" }), "justify-center")}
            onClick={() => {
               document.dispatchEvent(new CustomEvent("new_chat"));
               //    setOpenMobile(false);
               //    navigate({ to: "/" });
            }}
         >
            New Chat
         </Button>
         <Button
            variant="outline"
            onClick={() => {
               //    setOpenMobile(false);
               setCommandKOpen(true);
            }}
         >
            <Search className="h-4 w-4" />
            <span className="ml-2">Search chats</span>
            <div className="ml-auto flex items-center gap-1 text-xs">
               <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-muted-foreground">
                  <span className="text-sm">⌘</span>
                  <span className="text-xs">K</span>
               </kbd>
            </div>
         </Button>
         <CommandK open={commandKOpen} onOpenChange={setCommandKOpen} />
      </div>
   );
}
