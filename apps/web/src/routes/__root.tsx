import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
	fetchSession,
	getCookieName,
} from "@convex-dev/better-auth/react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { createAuth } from "@docsurf/backend/convex/auth";
import { Toaster } from "@docsurf/ui/components/sonner";
import appCss from "@docsurf/ui/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
// import Loader from "@/components/loader";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getWebRequest } from "@tanstack/react-start/server";
import type { ConvexReactClient } from "convex/react";
import type * as React from "react";
import { CookieConsent } from "@/components/cookies/cookie-dialog";
import { Providers } from "@/components/providers/providers";
import { authClient } from "@/lib/auth-client";
import { seo } from "@/utils/seo";
import Header from "../components/header";

export interface RouterAppContext {
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
	convexQueryClient: ConvexQueryClient;
}

// Server side session request
const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
	const sessionCookieName = await getCookieName(createAuth);
	const token = getCookie(sessionCookieName);
	const request = getWebRequest();
	const { session } = await fetchSession(createAuth, request);
	return {
		userId: session?.user.id,
		token,
	};
});

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({
				title: "Docsurf",
				description: "Docsurf is a web application",
			}),
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			// { rel: "manifest", href: "/site.webmanifest", color: "#ffffff" },
		],
	}),
	beforeLoad: async (ctx) => {
		const auth = await fetchAuth();
		const { userId, token } = auth;

		// During SSR only (the only time serverHttpClient exists),
		// set the auth token to make HTTP queries with.
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return {
			userId,
			token,
		};
	},
	component: RootComponent,
});

function RootComponent() {
	const context = useRouteContext({ from: Route.id });
	return (
		<ConvexBetterAuthProvider
			client={context.convexClient}
			authClient={authClient}
		>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</ConvexBetterAuthProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen max-w-screen antialiased">
				<Providers
					attribute="class"
					enableSystem
					disableTransitionOnChange
					defaultTheme="dark"
					storageKey="vite-ui-theme"
				>
					{/* <Header /> */}
					{children}
					{/* <CookieConsent /> */}
					<Toaster richColors />
				</Providers>
				<TanStackRouterDevtools position="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
