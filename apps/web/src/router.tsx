import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { routeTree } from "./routeTree.gen";
import "@docsurf/ui/globals.css";
import { DefaultCatchBoundary } from "./components/default-catch-boundary";
import { NotFound } from "./components/not-found";
import { env } from "./env";
import Loader from "./components/loader";

export function createRouter() {
   const CONVEX_URL = env.VITE_CONVEX_URL;

   const convex = new ConvexReactClient(CONVEX_URL, {
      unsavedChangesWarning: false,
   });

   const convexQueryClient = new ConvexQueryClient(convex);

   const queryClient: QueryClient = new QueryClient({
      defaultOptions: {
         queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 5,
            queryKeyHashFn: convexQueryClient.hashFn(),
            queryFn: convexQueryClient.queryFn(),
         },
      },
   });
   convexQueryClient.connect(queryClient);

   const router = routerWithQueryClient(
      createTanStackRouter({
         routeTree,
         defaultPreload: "intent",
         defaultErrorComponent: DefaultCatchBoundary,
         defaultNotFoundComponent: () => <NotFound />,
         // defaultPendingComponent: () => <Loader />,
         scrollRestoration: true,
         context: { queryClient, convexClient: convex, convexQueryClient },
         Wrap: ({ children }) => <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>,
      }),
      queryClient
   );
   return router;
}

declare module "@tanstack/react-router" {
   interface Register {
      router: ReturnType<typeof createRouter>;
   }
}
