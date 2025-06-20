import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_CONVEX_URL: z.string().url(),
		VITE_GOOGLE_CLIENT_ID: z.string(),
		VITE_GOOGLE_CLIENT_SECRET: z.string(),
		VITE_SITE_URL: z.string().url(),
		VITE_CONVEX_SITE_URL: z.string().url(),
		VITE_RESEND_API_KEY: z.string(),
	},
	runtimeEnv: import.meta.env,
});
