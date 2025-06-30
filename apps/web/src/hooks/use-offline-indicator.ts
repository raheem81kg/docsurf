import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { toast } from "sonner";

export function useOfflineIndicator() {
   useEffect(() => {
      let offlineToastId: string | number | null = null;
      return onlineManager.subscribe(() => {
         if (onlineManager.isOnline()) {
            if (offlineToastId !== null) {
               toast.dismiss(offlineToastId);
               offlineToastId = null;
            }
            showToast("Back online!", "success", {
               duration: 2000,
            });
         } else {
            offlineToastId = showToast("You are offline", "error", {
               duration: Number.POSITIVE_INFINITY,
            });
         }
      });
   }, []);
}
