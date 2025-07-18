import { TooltipProvider } from "@docsurf/ui/components/tooltip";
// import { CompliantCookieProvider } from "./compliant-cookie-provider";
import { CookiesProvider } from "react-cookie";
import { PostHogProvider } from "./posthog/posthog-provider";
import { ThemeProvider } from "./theme-provider";
import { ClientOnly } from "@tanstack/react-router";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { HotkeysProvider } from "react-hotkeys-hook";
// import { ModalProvider } from "./modal-provider";

export function Providers({ children }: { children: React.ReactNode }) {
   return (
      <ClientOnly>
         <HotkeysProvider initiallyActiveScopes={["global", "navigation"]}>
            <ConvexQueryCacheProvider>
               <ThemeProvider>
                  <PostHogProvider>
                     <CookiesProvider>
                        {/* <ModalProvider> */}
                        {/* <CompliantCookieProvider> */}
                        {import.meta.env.NODE_ENV === "development" ? (
                           <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
                        ) : (
                           <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
                        )}
                        {/* </ModalProvider> */}
                        {/* </CompliantCookieProvider> */}
                     </CookiesProvider>
                  </PostHogProvider>
               </ThemeProvider>
            </ConvexQueryCacheProvider>
         </HotkeysProvider>
      </ClientOnly>
   );
}
