import { DialogDescription, DialogTitle, DialogTrigger } from "@docsurf/ui/components/dialog";

import { DialogHeader } from "@docsurf/ui/components/dialog";

import { DialogClose } from "@docsurf/ui/components/dialog";

import { DialogContent, DialogFooter } from "@docsurf/ui/components/dialog";

import { Question, X } from "@phosphor-icons/react";
import { Button } from "@docsurf/ui/components/button";
import { Dialog } from "@docsurf/ui/components/dialog";
import {
   Drawer,
   DrawerHeader,
   DrawerContent,
   DrawerTrigger,
   DrawerTitle,
   DrawerDescription,
   DrawerFooter,
   DrawerClose,
} from "@docsurf/ui/components/drawer";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { useState } from "react";
import { FaqContent } from "./faq-content";
import { SidebarMenuButton } from "@docsurf/ui/components/sidebar";

/**
 * Renders a Help button that opens a dialog or drawer with FAQ and support info for DocSurf.
 */
export default function UserGuide() {
   const isMobile = useIsMobile();
   const [showFaqDialog, setShowFaqDialog] = useState(false);

   return (
      <>
         {isMobile ? (
            <Drawer open={showFaqDialog} onOpenChange={setShowFaqDialog}>
               <DrawerTrigger asChild>
                  <SidebarMenuButton size="sm" className="cursor-pointer hover:bg-bg-subtle/90 dark:hover:bg-bg-subtle/70">
                     <Question className="h-4 w-4" weight="bold" />
                     <span>User Guide</span>
                  </SidebarMenuButton>
               </DrawerTrigger>
               <DrawerContent className="px-4 [&>div:first-child]:hidden">
                  <DrawerHeader className="text-center pb-1">
                     <div className="mx-auto w-12 h-1 bg-muted-foreground/20 rounded-full mb-4" />
                     <DrawerTitle className="text-xl font-semibold">User Guide</DrawerTitle>
                     <DrawerDescription className="text-muted-foreground text-sm">
                        Frequently asked questions about DocSurf
                     </DrawerDescription>
                  </DrawerHeader>

                  <div className="overflow-auto max-h-[calc(80vh-140px)] rounded-xl border border-muted p-1 bg-background scrollbar-hide">
                     <FaqContent />
                  </div>

                  <DrawerFooter className="mt-2 pb-6">
                     <div className="flex justify-end">
                        <DrawerClose asChild>
                           <Button variant="secondary" className="rounded-full px-6 h-9 w-full">
                              Done
                           </Button>
                        </DrawerClose>
                     </div>
                  </DrawerFooter>
               </DrawerContent>
            </Drawer>
         ) : (
            <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
               <DialogTrigger asChild>
                  <SidebarMenuButton size="sm" className="cursor-pointer hover:bg-bg-subtle/90 dark:hover:bg-bg-subtle/70">
                     <Question className="h-4 w-4" weight="bold" />
                     <span>User Guide</span>
                  </SidebarMenuButton>
               </DialogTrigger>
               <DialogContent className="sm:max-w-lg rounded-2xl border shadow-lg gap-2 p-3 [&>button]:hidden">
                  <div className="absolute right-4 top-4">
                     <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-muted hover:bg-muted/80 focus:ring-0">
                           <X className="w-3.5 h-3.5" weight="bold" />
                           <span className="sr-only">Close</span>
                        </Button>
                     </DialogClose>
                  </div>

                  <DialogHeader className="pb-1 space-y-1">
                     <DialogTitle className="text-lg font-semibold">User Guide</DialogTitle>
                     <DialogDescription className="text-muted-foreground text-sm">
                        Frequently asked questions about DocSurf
                     </DialogDescription>
                  </DialogHeader>

                  <div className="overflow-auto max-h-[calc(80vh-140px)] my-3 pr-1 rounded-xl border border-muted/50 p-1 bg-background/50 scrollbar-hide">
                     <FaqContent />
                  </div>

                  <DialogFooter className="flex items-center justify-end !mt-0 !pt-0">
                     <DialogClose asChild>
                        <Button variant="secondary" className="rounded-full px-5 h-9 w-full">
                           Done
                        </Button>
                     </DialogClose>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
         )}
      </>
   );
}
