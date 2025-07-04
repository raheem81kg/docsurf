import { env } from "@/env";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { PostHogProvider as PostHog, usePostHog } from "posthog-js/react";
import { type PropsWithChildren, useEffect } from "react";
import { useSession } from "@/hooks/auth-hooks";

function PostHogUserIdentifier() {
   const posthog = usePostHog();
   const { data: session } = useSession();
   const { data: user } = useQuery({
      ...convexQuery(api.auth.getCurrentUser, {}),
      enabled: !!session?.user,
   });

   useEffect(() => {
      if (user?.email) {
         posthog?.identify(user.email, {
            email: user.email,
         });
      } else {
         posthog?.reset();
      }
   }, [posthog, user?.email]);

   return null;
}

export function PostHogProvider({ children }: PropsWithChildren) {
   return (
      <PostHog
         apiKey={env.VITE_POSTHOG_KEY}
         options={{
            api_host: "/api/phr",
            capture_exceptions: true,
            // debug: import.meta.env.MODE === "development"
         }}
      >
         <PostHogUserIdentifier />
         {children}
      </PostHog>
   );
}
