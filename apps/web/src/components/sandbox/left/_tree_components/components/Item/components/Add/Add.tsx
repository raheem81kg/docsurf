import React from "react";
import { PlusIcon } from "lucide-react";
import { Tooltip, TooltipContent } from "@docsurf/ui/components/tooltip";
import { cn } from "@docsurf/ui/lib/utils";
// import { useRateLimit } from "@convex-dev/rate-limiter/react";
// import { api } from "@docsurf/backend/convex/_generated/api";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { DOCUMENT_CREATION_RATE_LIMIT } from "@docsurf/utils/constants/constants";

interface AddChildButtonProps {
   onAddChild: () => void;
}

export const Add = ({ onAddChild }: AddChildButtonProps) => {
   // const { status } = useRateLimit(api.documents.getCreateDocumentRateLimit, {
   //    getServerTimeMutation: api.documents.getCreateDocumentServerTime,
   // });
   // const isNotAuthenticated = status && (status as any).key === "NOT_AUTHENTICATED";
   return (
      <Tooltip delayDuration={100} disableHoverableContent>
         {/* <TooltipTrigger asChild> */}
         <button
            type="button"
            onClick={async (e) => {
               e.preventDefault();
               e.stopPropagation();
               // if (isNotAuthenticated) {
               //    showToast("Please log in to create documents.", "error");
               //    return;
               // }
               // if (status && !status.ok) {
               //    showToast(
               //       (status as any).reason ||
               //          `Document creation rate limit reached (${DOCUMENT_CREATION_RATE_LIMIT} per day). Try again tomorrow.`,
               //       "error"
               //    );
               //    return;
               // }
               let loadingToastId: string | number | null = null;
               let timer: NodeJS.Timeout | null = null;
               let finished = false;
               try {
                  timer = setTimeout(() => {
                     if (!finished) {
                        loadingToastId = showToast("Creating document...", "warning", { duration: Number.POSITIVE_INFINITY });
                     }
                  }, 2000);
                  const result = onAddChild();
                  function isPromise<T = unknown>(value: unknown): value is Promise<T> {
                     return !!value && typeof (value as any).then === "function";
                  }
                  if (isPromise(result)) {
                     await result;
                  }
                  finished = true;
                  if (timer) clearTimeout(timer);
                  if (loadingToastId) {
                     showToast("Document created!", "success", { duration: 3000, id: loadingToastId });
                  }
               } catch (err) {
                  finished = true;
                  if (timer) clearTimeout(timer);
                  if (loadingToastId) {
                     showToast("Couldn't create document. Please check your connection and try again.", "error", {
                        duration: 4000,
                        id: loadingToastId,
                     });
                  } else {
                     showToast("Couldn't create document. Please check your connection and try again.", "error");
                  }
               }
            }}
            className={cn(
               "p-1 rounded-sm hover:bg-gray-100/10",
               "focus:outline-none focus-visible:ring-2 focus-visible:ring-background"
            )}
            // disabled={isNotAuthenticated || (status && !status.ok)}
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
