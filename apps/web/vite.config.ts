import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import analyzer from "vite-bundle-analyzer";
import { generateSitemap } from "tanstack-router-sitemap";
import { sitemap } from "./src/lib/sitemap";

// process.env musst be used in the vite config, the import.meta.env is not available in the vite config
export default defineConfig({
   server: {
      proxy: {
         "/api/phr": {
            target: "https://us.i.posthog.com",
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/phr/, ""),
         },
      },
   },
   plugins: [
      (process.env.ANALYZE && analyzer()) || null,
      tsconfigPaths(),
      tailwindcss(),
      generateSitemap(sitemap),
      tanstackStart({
         target: "vercel",
         // SPA mode enabled for Vercel static deployment
         spa: {
            enabled: true,
         },
         react: {
            babel: {
               plugins: [
                  [
                     "babel-plugin-react-compiler",
                     {
                        sources: (filename: string) => {
                           if (
                              // https://github.com/lucide-icons/lucide/issues/2386
                              filename.includes("email")
                           ) {
                              return false;
                           }

                           return true;
                        },
                     },
                  ],
               ],
            },
         },
      }),
      svgr({ include: "**/*.svg" }),
   ],
});
