import { CustomerPortal } from "@polar-sh/tanstack-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/portal").methods({
	GET: async () => {
		if (!process.env.POLAR_ACCESS_TOKEN) {
			throw new Error("POLAR_ACCESS_TOKEN is not set");
		}
		return CustomerPortal({
			accessToken: process.env.POLAR_ACCESS_TOKEN,
			getCustomerId: async (request: Request) => "", // Function to resolve a Polar Customer ID
			server: "sandbox", // Use sandbox if you're testing Polar - omit the parameter or pass 'production' otherwise
		});
	},
});
