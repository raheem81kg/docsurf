import { Checkout } from "@polar-sh/tanstack-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/checkout/").methods({
	GET: async () => {
		return Checkout({
			accessToken: process.env.POLAR_ACCESS_TOKEN,
			successUrl: process.env.SUCCESS_URL,
			server: "sandbox", // Use sandbox if you're testing Polar - omit the parameter or pass 'production' otherwise
		});
	},
});
