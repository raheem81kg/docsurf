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
         const isOnline = onlineManager.isOnline();
         // Always dismiss any existing offline toast when back online
         if (isOnline) {
            if (offlineToastId.current !== null) {
               toast.dismiss(offlineToastId.current);
               offlineToastId.current = null;
            }
            showToast("Back online!", "success", { duration: 2000 });
         } else {
            // Only show the offline toast if not already shown
            if (offlineToastId.current === null) {
               const id = showToast("You are offline", "error", {
                  duration: Number.POSITIVE_INFINITY,
               });
               offlineToastId.current = id;
            }
         }
      };

      // Subscribe to online status changes
      const unsubscribe = onlineManager.subscribe(handleStatus);

      // On mount, check initial status (in case already offline)
      handleStatus();

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
