import type { Sitemap } from "tanstack-router-sitemap";
import type { FileRouteTypes } from "@/routeTree.gen";

// This will become a string literal union of all your routes
export type TRoutes = FileRouteTypes["fullPaths"];

// process.env musst be used in the vite config, the import.meta.env is not available in the vite config

// Define your sitemap
export const sitemap: Sitemap<TRoutes> = {
   siteUrl: process.env.VITE_SITE_URL || "https://docsurf.ai",
   defaultPriority: 0.5,
   defaultChangeFreq: "weekly",
   routes: {
      // Welcome/Marketing pages - High priority (these should be indexed)
      "/": {
         priority: 1.0,
         changeFrequency: "daily",
         lastModified: new Date(),
      },
      "/about": {
         priority: 0.8,
         changeFrequency: "monthly",
      },
      "/pricing": {
         priority: 0.9,
         changeFrequency: "weekly",
      },
      "/terms": {
         priority: 0.3,
         changeFrequency: "yearly",
      },
      "/policy": {
         priority: 0.3,
         changeFrequency: "yearly",
      },

      // Auth pages - Excluded from sitemap since they have noindex robots
      // "/auth": false, // Explicitly exclude auth pages

      // Main app pages - Excluded from sitemap since they have noindex robots
      // These are behind authentication and shouldn't be crawled
      // "/doc": false,
      // "/doc/library": false,

      // Settings pages - Excluded from sitemap (behind auth + noindex)
      // All settings routes are excluded since they're private

      // Dynamic routes - Excluded since they're app pages with noindex
      "/doc/$documentId": async (route: string) => {
         // Documents are private and have noindex robots directive
         // Return empty array to exclude from sitemap
         return [];
      },

      // "/s/$sharedThreadId": async (route: string) => {/
      // TODO: Implement dynamic shared thread route generation
      // Similar to documents, you'd fetch shared threads here

      // Example implementation (uncomment and modify when ready):
      /*
      try {
        const sharedThreads = await fetch(`${env.VITE_SITE_URL}/api/shared-threads`).then(r => r.json());
        return sharedThreads.map((thread: any) => ({
          path: `/s/${thread.id}`,
          priority: 0.4,
          changeFrequency: "monthly",
          lastModified: thread.updatedAt,
        }));
      } catch (error) {
        console.warn('Failed to fetch shared threads for sitemap:', error);
        return [];
      }
      */

      //  return [];
      // },
   },
   // Note: App routes with noindex robots directive are excluded by omission:
   // - /auth* (All auth routes)
   // - /doc* (All document routes except dynamic ones above)
   // - /settings* (All settings routes)
};
