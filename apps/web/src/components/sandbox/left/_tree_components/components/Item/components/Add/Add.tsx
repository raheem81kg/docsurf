import React from "react";
import { PlusIcon } from "lucide-react";
import { Tooltip, TooltipContent } from "@docsurf/ui/components/tooltip";
import { cn } from "@docsurf/ui/lib/utils";

interface AddChildButtonProps {
   onAddChild: () => void;
}

export const Add = ({ onAddChild }: AddChildButtonProps) => {
   return (
      <Tooltip delayDuration={100} disableHoverableContent>
         {/* <TooltipTrigger asChild> */}
         <button
            type="button"
            onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               onAddChild();
            }}
            className={cn(
               "p-1 rounded-sm hover:bg-gray-100/10",
               "focus:outline-none focus-visible:ring-2 focus-visible:ring-background"
            )}
         >
            <PlusIcon className="w-3.5 h-3.5 text-muted-foreground" />
         </button>
         {/* </TooltipTrigger> */}
         <TooltipContent side="bottom">
            <span className="text-xs">Add item</span>
         </TooltipContent>
      </Tooltip>
   );
};
