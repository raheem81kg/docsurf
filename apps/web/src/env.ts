import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
   clientPrefix: "VITE_",
   client: {
      VITE_CONVEX_URL: z.string().url(),
      VITE_SITE_URL: z.string().url(),
      VITE_CONVEX_SITE_URL: z.string().url(),
      VITE_DOCSURF_VERSION: z.string(),
      VITE_COMPANY_NAME: z.string(),
      VITE_POSTHOG_HOST: z.string().url(),
      VITE_POSTHOG_KEY: z.string(),
   },
   runtimeEnv: import.meta.env,
});
