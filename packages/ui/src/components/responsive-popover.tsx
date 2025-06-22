import * as React from "react";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@docsurf/ui/components/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@docsurf/ui/components/sheet";
import { cn } from "@docsurf/ui/lib/utils";

interface ResponsivePopoverProps {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   children: React.ReactNode;
   modal?: boolean;
}

interface ResponsivePopoverTriggerProps {
   children: React.ReactNode;
   asChild?: boolean;
}

interface ResponsivePopoverContentProps extends Omit<React.ComponentPropsWithoutRef<typeof PopoverContent>, "children"> {
   children: React.ReactNode;
   className?: string;
   title?: string;
   description?: string;
   side?: "top" | "right" | "bottom" | "left";
}

const ResponsivePopoverContext = React.createContext<{
   isMobile: boolean;
}>({
   isMobile: false,
});

export function ResponsivePopover({ open, onOpenChange, children, modal = true }: ResponsivePopoverProps) {
   const isMobile = useIsMobile();

   const contextValue = React.useMemo(() => ({ isMobile }), [isMobile]);

   if (isMobile) {
      return (
         <ResponsivePopoverContext.Provider value={contextValue}>
            <Sheet open={open} onOpenChange={onOpenChange} modal={modal}>
               {children}
            </Sheet>
         </ResponsivePopoverContext.Provider>
      );
   }

   return (
      <ResponsivePopoverContext.Provider value={contextValue}>
         <Popover open={open} onOpenChange={onOpenChange} modal={modal}>
            {children}
         </Popover>
      </ResponsivePopoverContext.Provider>
   );
}

export function ResponsivePopoverTrigger({ children, asChild = false }: ResponsivePopoverTriggerProps) {
   const { isMobile } = React.useContext(ResponsivePopoverContext);

   if (isMobile) {
      return <SheetTrigger asChild={asChild}>{children}</SheetTrigger>;
   }

   return <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>;
}

export function ResponsivePopoverContent({
   children,
   className,
   title,
   description,
   side = "bottom",
   align,
   alignOffset,
   sideOffset,
   ...props
}: ResponsivePopoverContentProps) {
   const { isMobile } = React.useContext(ResponsivePopoverContext);

   if (isMobile) {
      return (
         <SheetContent side={side} className={cn("max-h-[85dvh] overflow-y-auto bg-popover", className)}>
            {(title || description) && (
               <SheetHeader className="pb-0">
                  {title && <SheetTitle>{title}</SheetTitle>}
                  {description && <SheetDescription>{description}</SheetDescription>}
               </SheetHeader>
            )}
            <div className={cn(!title && !description && "mt-4")}>{children}</div>
         </SheetContent>
      );
   }

   return (
      <PopoverContent
         side={side}
         align={align}
         alignOffset={alignOffset}
         sideOffset={sideOffset}
         className={cn("bg-popover rounded-none md:rounded-md", className)}
         {...props}
      >
         {children}
      </PopoverContent>
   );
}
