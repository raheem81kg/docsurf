import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

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
      tsconfigPaths(),
      tailwindcss(),
      tanstackStart({
         target: "vercel",
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
