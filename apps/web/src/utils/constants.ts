import { env } from "@/env";

// Cookie constants
export const COOKIES = {
   MfaSetupVisited: "mfa-setup-visited",
   PreferredSignInProvider: "preferred-sign-in-provider",
} as const;

export const DOCSURF_VERSION = env.VITE_DOCSURF_VERSION as string;
export const COMPANY_NAME = env.VITE_COMPANY_NAME || "DocSurf, Inc.";

export const LEFT_SIDEBAR_COOKIE_NAME = "l_sidebar_state";
export const RIGHT_SIDEBAR_COOKIE_NAME = "r_sidebar_state";
export const INNER_RIGHT_SIDEBAR_COOKIE_NAME = "ir_sidebar_state";

export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
