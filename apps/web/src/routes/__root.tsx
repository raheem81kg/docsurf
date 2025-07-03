import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { fetchSession, getCookieName } from "@convex-dev/better-auth/react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { createAuth } from "@docsurf/backend/convex/auth";
import { Toaster } from "@docsurf/ui/components/sonner";
import appCss from "@docsurf/ui/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouteContext } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getWebRequest } from "@tanstack/react-start/server";
import type { ConvexReactClient } from "convex/react";
import type * as React from "react";
import { Providers } from "@/components/providers/providers";
import { authClient } from "@/lib/auth-client";
import { seo } from "@/utils/seo";
import { ThemeScript } from "@/components/providers/theme-script";
import { Analytics } from "@vercel/analytics/react";
import { getClientAppUrl } from "@/utils/envs";
import { env } from "@/env";

export interface RouterAppContext {
   queryClient: QueryClient;
   convexClient: ConvexReactClient;
   convexQueryClient: ConvexQueryClient;
}

// Server side session request
export const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
   const sessionCookieName = await getCookieName(createAuth);
   const token = getCookie(sessionCookieName);
   const request = getWebRequest();
   const { session } = await fetchSession(createAuth, request);
   return {
      userId: session?.user.id,
      token,
   };
});

export const fetchToken = createServerFn({ method: "GET" }).handler(async () => {
   const sessionCookieName = await getCookieName(createAuth);
   return getCookie(sessionCookieName);
});

const PROD_APP_URL = env.VITE_SITE_URL;

export const Route = createRootRouteWithContext<RouterAppContext>()({
   head: () => ({
      meta: [
         // --- SEO Meta Tags ---
         ...seo({
            title: "Docsurf: The AI document editor",
            description: "Docsurf is an AI document editor that allows you to create, edit, and share documents with ease.",
            image: `${PROD_APP_URL}/opengraph.jpg`,
            // keywords: "docs, surf, webapp, ..." // Add if you want
         }),
         // --- App & Theme Meta Tags ---
         {
            charSet: "utf-8",
         },
         {
            name: "viewport",
            content: "width=device-width, initial-scale=1",
         },
         {
            name: "mobile-web-app-capable",
            content: "yes",
         },
         {
            name: "theme-color",
            content: "oklch(1 0 0)",
            media: "(prefers-color-scheme: light)",
         },
         {
            name: "theme-color",
            content: "oklch(0.145 0 0)",
            media: "(prefers-color-scheme: dark)",
         },
         {
            property: "og:url",
            content: PROD_APP_URL,
         },

         // --- Added for Apple Web App Title ---
         {
            name: "apple-mobile-web-app-title",
            content: "Docsurf",
         },
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
         { rel: "manifest", href: "/manifest.webmanifest" },
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
         // --- Added favicon-96x96.png ---
         {
            rel: "icon",
            type: "image/png",
            sizes: "96x96",
            href: "/favicon-96x96.png",
         },
         // --- Added SVG favicon ---
         {
            rel: "icon",
            type: "image/svg+xml",
            href: "/favicon.svg",
         },
         // --- Added shortcut icon ---
         {
            rel: "shortcut icon",
            href: "/favicon.ico",
         },
         {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossOrigin: "anonymous",
         },
         {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Architects+Daughter&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fira+Code:wght@300..700&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Outfit:wght@100..900&family=Oxanium:wght@200..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100..900;1,100..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Space+Grotesk:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap",
         },

         // { rel: "manifest", href: "/site.webmanifest", color: "#ffffff" },
      ],
   }),
   // beforeLoad: async (ctx) => {
   //    const auth = await fetchAuth();
   //    const { userId, token } = auth;

   //    // During SSR only (the only time serverHttpClient exists),
   //    // set the auth token to make HTTP queries with.
   //    if (token) {
   //       ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
   //    }

   //    return {
   //       userId,
   //       token,
   //    };
   // },
   component: RootComponent,
});

function RootComponent() {
   const context = useRouteContext({ from: Route.id });
   return (
      <ConvexBetterAuthProvider client={context.convexClient} authClient={authClient}>
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
            <ThemeScript />
            <HeadContent />
         </head>
         <body className="min-h-screen max-w-screen antialiased">
            <Providers attribute="class" enableSystem disableTransitionOnChange defaultTheme="dark" storageKey="vite-ui-theme">
               {children}
               <Analytics />
               {/* TODO: Add cookie consent */}
               {/* <CookieConsent /> */}
               <Toaster richColors />
            </Providers>
            {/* <TanStackRouterDevtools position="bottom-right" /> */}
            <Scripts />
         </body>
      </html>
   );
}
