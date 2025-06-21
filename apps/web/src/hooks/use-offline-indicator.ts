import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";

export function useOfflineIndicator() {
   useEffect(() => {
      return onlineManager.subscribe(() => {
         if (onlineManager.isOnline()) {
            showToast("online", "success", {
               duration: 2000,
            });
         } else {
            showToast("offline", "error", {
               duration: Number.POSITIVE_INFINITY,
            });
         }
      });
   }, []);
}
