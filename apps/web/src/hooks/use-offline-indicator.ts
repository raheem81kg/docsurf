import { useEffect } from "react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { toast } from "sonner";

/**
 * Hook to show a toast when the user goes offline/online.
 * Uses native window event listeners for reliability in all environments.
 * Uses a constant string as the toast ID for the offline toast.
 */
export function useOfflineIndicator() {
   useEffect(() => {
      const offlineToastId = "offline-toast";

      const handleStatus = () => {
         const isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;
         if (isOnline) {
            toast.dismiss(offlineToastId);
            showToast("Back online!", "success", { duration: 2000 });
         } else {
            showToast("You are offline", "error", {
               duration: Number.POSITIVE_INFINITY,
               id: offlineToastId,
            });
         }
      };

      if (typeof window !== "undefined") {
         window.addEventListener("online", handleStatus);
         window.addEventListener("offline", handleStatus);
      }

      handleStatus();

      return () => {
         toast.dismiss(offlineToastId);
         if (typeof window !== "undefined") {
            window.removeEventListener("online", handleStatus);
            window.removeEventListener("offline", handleStatus);
         }
      };
   }, []);
}
