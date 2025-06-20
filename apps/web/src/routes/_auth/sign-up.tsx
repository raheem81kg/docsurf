"use client";

import { createFileRoute, redirect } from "@tanstack/react-router";
import SignUp from "@/components/auth/SignUp";

export const Route = createFileRoute("/_auth/sign-up")({
	component: SignUp,
	beforeLoad: ({ context }) => {
		if (context.userId) {
			throw redirect({ to: "/client-only" });
		}
	},
});
