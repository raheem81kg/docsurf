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
      // Welcome/Marketing pages - High priority
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

      // Auth pages - Lower priority since they're not meant to be indexed
      "/auth": {
         priority: 0.1,
         changeFrequency: "never",
      },

      // Main app pages - Medium priority
      "/doc": {
         priority: 0.7,
         changeFrequency: "daily",
      },
      "/doc/library": {
         priority: 0.6,
         changeFrequency: "daily",
      },

      // Settings pages - Lower priority, only for authenticated users
      "/settings/ai-options": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/appearance": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/attachments": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/customization": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/models": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/profile": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/providers": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/subscription": {
         priority: 0.2,
         changeFrequency: "monthly",
      },
      "/settings/usage": {
         priority: 0.2,
         changeFrequency: "monthly",
      },

      // Dynamic routes - These would need to be populated with actual data
      "/doc/$documentId": async (route: string) => {
         // TODO: Implement dynamic document route generation
         // You would typically fetch your documents from your database here
         // For now, returning empty array - you'll need to implement this based on your data

         // Example implementation (uncomment and modify when ready):
         /*
      try {
        const documents = await fetch(`${env.VITE_SITE_URL}/api/documents`).then(r => r.json());
        return documents.map((doc: any) => ({
          path: `/doc/${doc.id}`,
          priority: 0.6,
          changeFrequency: "weekly",
          lastModified: doc.updatedAt,
        }));
      } catch (error) {
        console.warn('Failed to fetch documents for sitemap:', error);
        return [];
      }
      */

         return [];
      },

      "/s/$sharedThreadId": async (route: string) => {
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

         return [];
      },
   },
};
