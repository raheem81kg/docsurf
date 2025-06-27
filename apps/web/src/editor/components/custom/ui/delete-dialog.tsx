"use client";

import { Loader, Trash2Icon } from "lucide-react";
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
import { useNavigate } from "@tanstack/react-router";
import { type PropsWithChildren, useRef } from "react";
import { DELETE_IRREVERSIBLE_MESSAGE } from "@docsurf/utils/constants/constants";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import type { Id } from "@docsurf/backend/convex/_generated/dataModel";

export default function DeleteDialog({
   children,
   id,
   redirectTo,
}: PropsWithChildren & {
   id: string;
   /**
    * redirect url, example /doc
    */
   redirectTo?: string;
}) {
   const { data: user, isLoading: userLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const workspaceId = user?.workspaces?.[0]?.workspace?._id;
   const deleteDocumentPermanently = useMutation(api.documents.deleteDocumentPermanently);
   const ref = useRef<HTMLButtonElement>(null);
   const navigate = useNavigate();
   const [isDeletePending, startDeleteTransition] = React.useTransition();
   const isMobile = useIsMobile();
   const isDesktop = !isMobile;

   const title = "Delete page permanently?";
   const description = DELETE_IRREVERSIBLE_MESSAGE;

   function onDelete() {
      if (!workspaceId || !id) return;
      startDeleteTransition(async () => {
         try {
            await deleteDocumentPermanently({ workspaceId, id: id as Id<"documents"> });
            ref.current?.click();
            if (redirectTo) navigate({ to: redirectTo });
         } catch (err) {
            showToast("Failed to delete document", "error");
         }
      });
   }

   if (isDesktop) {
      return (
         <Dialog modal>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription>{description}</DialogDescription>
               </DialogHeader>
               <DialogFooter className="gap-2 sm:space-x-0">
                  <DialogClose asChild>
                     <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                     aria-label="Delete permanently"
                     className="cursor-pointer"
                     variant="destructive"
                     onClick={userLoading ? undefined : onDelete}
                     disabled={userLoading || isDeletePending}
                  >
                     {(userLoading || isDeletePending) && <Loader className="mr-2 size-3.5 animate-spin" aria-hidden="true" />}
                     Yes, delete permanently
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      );
   }

   return (
      <Drawer modal>
         <DrawerTrigger asChild>{children}</DrawerTrigger>
         <DrawerContent>
            <DrawerHeader>
               <DrawerTitle>{title}</DrawerTitle>
               <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="gap-2 sm:space-x-0">
               <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
               </DrawerClose>
               <Button
                  aria-label="Delete permanently"
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={userLoading ? undefined : onDelete}
                  disabled={userLoading || isDeletePending}
               >
                  {(userLoading || isDeletePending) && <Loader className="mr-2 size-3.5 animate-spin" aria-hidden="true" />}
                  Yes, delete permanently
               </Button>
            </DrawerFooter>
         </DrawerContent>
      </Drawer>
   );
}
