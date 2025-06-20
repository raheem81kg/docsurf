"use client";

import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignIn } from "@/components/auth/SignIn";

export const Route = createFileRoute("/_auth/auth")({
	component: SignIn,
	beforeLoad: ({ context }) => {
		if (context.userId) {
			throw redirect({ to: "/client-only" });
		}
	},
});
