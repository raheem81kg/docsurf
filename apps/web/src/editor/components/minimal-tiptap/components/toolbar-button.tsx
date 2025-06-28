import * as React from "react";

import { cn } from "@docsurf/ui/lib/utils";
import { Toggle } from "@docsurf/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipContentPropsCopy } from "@docsurf/ui/components/tooltip";

interface ToolbarButtonProps extends React.ComponentPropsWithoutRef<typeof Toggle> {
   isActive?: boolean;
   tooltip?: string;
   tooltipOptions?: TooltipContentPropsCopy;
   disableHoverableContent?: boolean;
}

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
   ({ isActive, children, tooltip, className, tooltipOptions, disableHoverableContent = false, ...props }, ref) => {
      const toggleButton = (
         <Toggle
            size="sm"
            ref={ref}
            className={cn(
               "size-8 p-0 gap-0 border-none transition-none shadow-none hover:bg-muted hover:text-muted-foreground px-1.5 rounded-sm min-w-8",
               { "bg-accent": isActive },
               className
            )}
            {...props}
         >
            {children}
         </Toggle>
      );

      if (!tooltip) {
         return toggleButton;
      }

      return (
         <Tooltip disableHoverableContent={disableHoverableContent}>
            <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
            <TooltipContent sideOffset={5} {...tooltipOptions}>
               <div className="flex flex-col items-center text-center">{tooltip}</div>
            </TooltipContent>
         </Tooltip>
      );
   }
);

ToolbarButton.displayName = "ToolbarButton";

export default ToolbarButton;
