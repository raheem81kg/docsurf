import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
	beforeLoad: ({ context }) => {
		if (!context.userId) {
			throw redirect({ to: "/auth", statusCode: 302 });
		}
	},
});
