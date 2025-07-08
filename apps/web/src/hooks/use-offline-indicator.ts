import { onlineManager } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { toast } from "sonner";

/**
 * Hook to show a toast when the user goes offline/online.
 * Shows an infinite error toast when offline, and a short success toast when back online.
 */
export function useOfflineIndicator() {
   const offlineToastId = useRef<string | number | null>(null);
   const didMount = useRef(false);

   useEffect(() => {
      // Helper to show/hide toasts based on online status
      const handleStatus = () => {
         if (onlineManager.isOnline()) {
            if (offlineToastId.current !== null) {
               toast.dismiss(offlineToastId.current);
               offlineToastId.current = null;
               showToast("Back online!", "success", { duration: 2000 });
            }
         } else {
            if (offlineToastId.current === null) {
               offlineToastId.current = showToast("You are offline", "error", {
                  duration: Number.POSITIVE_INFINITY,
               });
            }
         }
      };

      // On mount, just subscribe, don't show any toast if online
      didMount.current = true;
      // Subscribe to online status changes
      const unsubscribe = onlineManager.subscribe(handleStatus);

      // Cleanup on unmount
      return () => {
         if (offlineToastId.current !== null) {
            toast.dismiss(offlineToastId.current);
            offlineToastId.current = null;
         }
         unsubscribe();
      };
   }, []);
}
