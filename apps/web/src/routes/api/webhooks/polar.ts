import { Webhooks } from "@polar-sh/tanstack-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/webhooks/polar").methods(
	{
		POST: async () => {
			if (!process.env.POLAR_WEBHOOK_SECRET) {
				throw new Error("POLAR_WEBHOOK_SECRET is not set");
			}
			return Webhooks({
				webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
				onPayload: async (payload) => {
					// Handle the payload
					// No need to return an acknowledge response
				},
			});
		},
	},
);
