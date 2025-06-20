import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute(
	"/api/checkout/success",
).methods({
	GET: async ({ request }) => {
		const url = new URL(request.url);
		const isDesktop = url.searchParams.get("isDesktop") === "true";
		const redirectPath = url.searchParams.get("redirectPath") ?? "/";

		if (isDesktop) {
			url.pathname = "/desktop/checkout/success";
			url.searchParams.set("redirectPath", redirectPath);
			return Response.redirect(url.toString());
		}

		return Response.redirect(new URL(redirectPath, request.url).toString());
	},
});
