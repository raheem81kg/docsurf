import { TooltipProvider } from "@docsurf/ui/components/tooltip";
import { type ThemeProviderProps, ThemeProvider as NextThemesProvider } from "next-themes";
// import { CompliantCookieProvider } from "./compliant-cookie-provider";
import { CookiesProvider } from "react-cookie";
import { PostHogProvider } from "./posthog-provider";
import { ThemeProvider } from "./theme-provider";
import { ClientOnly } from "@tanstack/react-router";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { HotkeysProvider } from "react-hotkeys-hook";

interface ProvidersProps extends ThemeProviderProps {}

export function Providers({ children, ...props }: ProvidersProps) {
   return (
      <ClientOnly>
         <HotkeysProvider initiallyActiveScopes={["global", "navigation"]}>
            <ConvexQueryCacheProvider>
               <ThemeProvider>
                  <PostHogProvider>
                     <CookiesProvider>
                        {/* <CompliantCookieProvider> */}
                        {import.meta.env.NODE_ENV === "development" ? (
                           <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
                        ) : (
                           <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
                        )}
                        {/* </CompliantCookieProvider> */}
                     </CookiesProvider>
                  </PostHogProvider>
               </ThemeProvider>
            </ConvexQueryCacheProvider>
         </HotkeysProvider>
      </ClientOnly>
   );
}
