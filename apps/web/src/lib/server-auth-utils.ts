import { reactStartHelpers } from "@convex-dev/better-auth/react-start";
import { createAuth } from "@docsurf/backend/convex/auth_create";

export const { fetchSession, reactStartHandler, getCookieName } = reactStartHelpers(createAuth, {
   convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL,
});
