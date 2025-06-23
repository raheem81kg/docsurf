import { Loader } from "lucide-react";
import * as React from "react";

import { Button } from "@docsurf/ui/components/button";
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@docsurf/ui/components/dialog";
import {
   Drawer,
   DrawerClose,
   DrawerContent,
   DrawerDescription,
   DrawerFooter,
   DrawerHeader,
   DrawerTitle,
   DrawerTrigger,
} from "@docsurf/ui/components/drawer";
import { useIsMobile } from "@docsurf/ui/hooks/use-mobile";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

interface SignOutDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
   showTrigger?: boolean;
   onSuccess?: () => void;
   scope?: "local" | "global" | "others";
}

export function SignOutDialog({ showTrigger = true, children, scope = "local", onSuccess, ...props }: SignOutDialogProps) {
   const [isSignOutPending, startSignOutTransition] = React.useTransition();
   const isMobile = useIsMobile();
   const isDesktop = !isMobile;
   const navigate = useNavigate();
   const title = {
      local: "Are you sure, do you want to log out?",
      global: "Are you sure, do you want to log out from all logged device?",
      others: "Are you sure, do you want to log out from other logged device?",
   };

   const description = {
      local: "You will be logged out from this device only.",
      global: "You will be logged out from all devices where you are currently signed in.",
      others: "You will be logged out from all other devices except this one.",
   };

   function onSignOut() {
      startSignOutTransition(async () => {
         const queryClient = useQueryClient();
         await queryClient.resetQueries({ queryKey: ["session"] });
         await queryClient.resetQueries({ queryKey: ["token"] });
         await authClient.signOut();
         void navigate({ to: "/auth" });
         const keys = Object.keys(localStorage);
         for (const key of keys) {
            if (key.includes("_CACHE")) {
               localStorage.removeItem(key);
            }
         }

         props.onOpenChange?.(false);
         onSuccess?.();
      });
   }

   if (isDesktop) {
      return (
         <Dialog {...props}>
            {showTrigger ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
            <DialogContent>
               <DialogHeader>
                  <VisuallyHidden>
                     <DialogTitle>{title["local"]}</DialogTitle>
                  </VisuallyHidden>
                  <DialogDescription>{description["local"]}</DialogDescription>
               </DialogHeader>
               <DialogFooter className="gap-2 sm:space-x-0">
                  <DialogClose asChild>
                     <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                     aria-label="Sign out"
                     className="cursor-pointer"
                     variant="destructive"
                     onClick={onSignOut}
                     disabled={isSignOutPending}
                  >
                     {isSignOutPending && <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />}
                     Yes
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      );
   }

   return (
      <Drawer {...props}>
         {showTrigger ? <DrawerTrigger asChild>{children}</DrawerTrigger> : null}
         <DrawerContent>
            <DrawerHeader>
               <DrawerTitle>{title["local"]}</DrawerTitle>
               <DrawerDescription>{description["local"]}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="gap-2 sm:space-x-0">
               <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
               </DrawerClose>
               <Button
                  aria-label="Sign out"
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={onSignOut}
                  disabled={isSignOutPending}
               >
                  {isSignOutPending && <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />}
                  Yes
               </Button>
            </DrawerFooter>
         </DrawerContent>
      </Drawer>
   );
}
