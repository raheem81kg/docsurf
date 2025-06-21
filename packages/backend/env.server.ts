import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
   server: {
      POLAR_ORGANIZATION_TOKEN: z.string(),
      POLAR_WEBHOOK_SECRET: z.string(),
   },
   runtimeEnv: process.env,
   emptyStringAsUndefined: true,
});
