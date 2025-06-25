import React, { forwardRef, useState, useEffect } from "react";
import { Ellipsis, X, Trash2Icon, CopyIcon, AppWindowIcon, FormInputIcon } from "lucide-react";
import { Action, type Props as ActionProps } from "../Action/Action";
import { Popover, PopoverContent, PopoverTrigger } from "@docsurf/ui/components/popover";
import { useCopyToClipboard } from "usehooks-ts";
import { timeAgo } from "@docsurf/utils/time-ago";
import { cn } from "@docsurf/ui/lib/utils";

export interface ItemOptionsProps extends ActionProps {
   uuid: string;
   is_locked?: boolean;
   onRename?: () => void;
   onRemove?: () => void;
   created_at?: string;
   updated_at?: string;
}

export const ItemOptions = forwardRef<HTMLButtonElement, ItemOptionsProps>((props, ref) => {
   const { onClick, uuid, is_locked, onRename, onRemove, created_at, updated_at, ...rest } = props;
   const [open, setOpen] = useState(false);
   const [confirmingRemove, setConfirmingRemove] = useState(false);
   const [_, copy] = useCopyToClipboard();

   const createdAt = created_at
      ? new Date(created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : null;
   const updatedAt = updated_at ? timeAgo(new Date(updated_at), { withAgo: true }) : null;

   const handleRenameClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (is_locked) return;
      setOpen(false);
      if (onRename) onRename();
   };

   // Add click-away handler for confirmation state
   useEffect(() => {
      if (!confirmingRemove) return;

      let isSubscribed = true;

      function handleClick(e: MouseEvent) {
         if (!isSubscribed) return;

         const target = e.target as HTMLElement;
         const removeButton = document.querySelector('[aria-label="Confirm remove"]');

         // If click is outside the button, reset the confirmation state
         if (removeButton && !removeButton.contains(target)) {
            setConfirmingRemove(false);
         }
      }

      document.addEventListener("mousedown", handleClick);
      return () => {
         isSubscribed = false;
         document.removeEventListener("mousedown", handleClick);
      };
   }, [confirmingRemove]);

   // Reset confirmation state when popover closes
   useEffect(() => {
      if (!open) {
         setConfirmingRemove(false);
      }
   }, [open]);

   return (
      <Popover open={open} onOpenChange={setOpen} modal>
         <PopoverTrigger asChild>
            <Action
               ref={ref}
               onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpen(true);
               }}
               className={cn(
                  "bg-transparent border-none outline-none cursor-pointer rounded-sm !p-2.5 text-sidebar",
                  "transition-colors hover:bg-accent/50",
                  open && "bg-doc-brand",
                  props.className
               )}
               {...rest}
            >
               <Ellipsis className="w-3.5 h-3.5 text-muted-foreground" />
            </Action>
         </PopoverTrigger>
         <PopoverContent className="w-56 bg-default p-1" side="right" align="start" sideOffset={5}>
            {/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
            <div
               onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  return;
               }}
            >
               <button
                  type="button"
                  className={cn(
                     "flex w-full items-center gap-2 px-2 py-2 text-xs font-normal text-left",
                     "hover:bg-accent/50 hover:text-primary transition-colors",
                     "outline-none rounded-t-md rounded-b-none"
                  )}
                  onClick={() => {
                     copy(`${window.location.origin}/doc/${uuid}`);
                     setOpen(false);
                  }}
               >
                  <div className="flex items-center">
                     <CopyIcon className="h-4 w-4 mr-2" />
                     Copy link
                  </div>
               </button>
               <button
                  type="button"
                  className={cn(
                     "flex w-full items-center gap-2 px-2 py-2 text-xs font-normal text-left",
                     "hover:bg-accent/50 hover:text-primary transition-colors",
                     "outline-none rounded-none"
                  )}
                  onClick={() => {
                     window.open(new URL(`/doc/${uuid}`, window.location.origin));
                     setOpen(false);
                  }}
               >
                  <div className="flex items-center">
                     <AppWindowIcon className="h-4 w-4 mr-2" />
                     Open in new tab
                  </div>
               </button>
               <button
                  type="button"
                  disabled={!!is_locked}
                  onClick={handleRenameClick}
                  className={cn(
                     "flex w-full items-center gap-2 px-2 py-2 text-xs font-normal text-left",
                     "hover:bg-accent/50 hover:text-primary transition-colors",
                     "outline-none rounded-none",
                     "disabled:opacity-60"
                  )}
               >
                  <div className="flex items-center">
                     <FormInputIcon className="h-4 w-4 mr-2" />
                     Rename
                  </div>
               </button>
               <button
                  type="button"
                  disabled={!!is_locked}
                  className={cn(
                     "flex w-full items-center gap-2 px-2 py-2 text-xs font-normal text-left",
                     "hover:bg-red-50 hover:text-red-600 transition-colors",
                     "outline-none rounded-b-md rounded-t-none",
                     confirmingRemove && "bg-red-600 text-white hover:bg-red-700 hover:text-default"
                  )}
                  onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();

                     if (!confirmingRemove) {
                        setConfirmingRemove(true);
                        return;
                     }

                     setOpen(false);
                     if (onRemove) onRemove();
                  }}
                  aria-label={confirmingRemove ? "Confirm remove" : "Move to trash"}
               >
                  <div className="flex items-center">
                     {confirmingRemove ? (
                        <>
                           <svg xmlns="http://www.w3.org/2000/svg" width={18} height={13} fill="none" className="mr-2">
                              <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                           </svg>
                           Confirm Remove
                        </>
                     ) : (
                        <>
                           <Trash2Icon className="h-4 w-4 mr-2" />
                           Move to trash
                        </>
                     )}
                  </div>
               </button>
            </div>
            {(createdAt || updatedAt) && (
               <div className="border-t p-3 mt-1">
                  {createdAt && <p className="mb-1 text-[10px] text-muted-foreground">Created {createdAt}</p>}
                  {updatedAt && <p className="text-[10px] text-muted-foreground">Last updated {updatedAt}</p>}
               </div>
            )}
         </PopoverContent>
      </Popover>
   );
});
