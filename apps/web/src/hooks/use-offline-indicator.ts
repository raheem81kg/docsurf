import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export function useOfflineIndicator() {
	useEffect(() => {
		return onlineManager.subscribe(() => {
			if (onlineManager.isOnline()) {
				toast.success("online", {
					id: "ReactQuery",
					duration: 2000,
				});
			} else {
				toast.error("offline", {
					id: "ReactQuery",
					duration: Number.POSITIVE_INFINITY,
				});
			}
		});
	}, []);
}
