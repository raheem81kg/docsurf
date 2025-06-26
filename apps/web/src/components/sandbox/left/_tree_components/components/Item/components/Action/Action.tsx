// File: Action.tsx
// Purpose: A generic button component for actions in the tree, used for popover/menu triggers, with event propagation control.

import React, { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@docsurf/ui/lib/utils";

/**
 * Action is a generic button for tree item actions (e.g., popover triggers).
 * It stops event propagation to prevent triggering parent click handlers (e.g., collapse).
 */
export interface Props extends HTMLAttributes<HTMLButtonElement> {
   active?: boolean;
}

export const Action = forwardRef<HTMLButtonElement, Props>(({ active, className, onClick, ...props }, ref) => {
   return (
      <button
         ref={ref}
         {...props}
         className={cn(
            "flex items-center justify-center",
            "outline-none appearance-none",
            "p-1 rounded-sm hover:bg-gray-100/10",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-background",
            className
         )}
         onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick(e);
         }}
      />
   );
});
