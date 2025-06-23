import { authClient } from "@/lib/auth-client";
import { skipToken, useMutation, useQuery, useQueryClient, type AnyUseQueryOptions, type QueryKey } from "@tanstack/react-query";
import type { BetterFetchOption, BetterFetchResponse } from "better-auth/react";
import { useCallback, useEffect, useMemo } from "react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { useRouteContext } from "@tanstack/react-router";
import { Route as RootRoute } from "../routes/__root";

// Types
type AuthClient = typeof authClient;
type SessionData = AuthClient["$Infer"]["Session"];

export type BetterFetchRequest<TData> = ({
   fetchOptions,
}: {
   fetchOptions: BetterFetchOption;
}) => Promise<BetterFetchResponse<TData> | TData>;

type UseAuthQueryProps<TData> = {
   queryKey: QueryKey;
   queryFn: BetterFetchRequest<TData>;
   options?: Partial<AnyUseQueryOptions>;
};

// Generic Auth Query Hook
export function useAuthQuery<TData>({ queryKey, queryFn, options }: UseAuthQueryProps<TData>) {
   const { data: sessionData } = useSession();

   return useQuery<TData>({
      queryKey,
      queryFn: sessionData ? () => queryFn({ fetchOptions: { throw: true } }) : skipToken,
      ...options,
   });
}

// Auth Hooks
export function useSession(options?: Partial<AnyUseQueryOptions>) {
   const result = useQuery<SessionData>({
      queryKey: ["session"],
      queryFn: () => authClient.getSession({ fetchOptions: { throw: true } }),
      ...options,
   });

   return {
      ...result,
      session: result.data?.session,
      user: result.data?.user,
   };
}

export const useListSessions = (options?: Partial<AnyUseQueryOptions>) => {
   return useAuthQuery({
      queryKey: ["sessions"],
      queryFn: ({ fetchOptions }) => authClient.listSessions({ fetchOptions }),
      options,
   });
};

export const useUpdateUser = () => {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (vars: { name: string }) => authClient.updateUser(vars),
      onSuccess: async () => {
         await queryClient.invalidateQueries({ queryKey: ["session"] });
      },
      onError: (error: Error) => {
         showToast("Something went wront when updating profile", "error");
      },
   });
};

export const useRevokeSession = () => {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (vars: { sessionId: string }) => authClient.revokeSession({ token: vars.sessionId }),
      onSuccess: async () => {
         await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
      onError: (error: Error) => {
         showToast("Something went wront when revoking session", "error");
      },
   });
};

export const useRevokeOtherSessions = () => {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: () => authClient.revokeOtherSessions(),
      onSuccess: async () => {
         await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
      onError: (error: Error) => {
         showToast("Something went wront when revoking other sessions", "error");
      },
   });
};

export function useVerifyToken(token: string | null | undefined, message = "Authentication required. Please sign in to continue.") {
   return useCallback(
      (action: () => void | Promise<void>) => {
         if (!token) {
            showToast(message, "error");
            return;
         }
         action();
      },
      [token, message]
   );
}

// Token Management
export const decodeJwt = (token: string) => {
   try {
      const parts = token.split(".");
      if (parts.length < 2 || !parts[1]) {
         return null;
      }

      const decode = (data: string) => {
         const normalizedData = data.replace(/-/g, "+").replace(/_/g, "/");
         if (typeof Buffer === "undefined") {
            return atob(normalizedData);
         }
         return Buffer.from(normalizedData, "base64").toString("utf8");
      };

      const payload = decode(parts[1]);
      return JSON.parse(payload);
   } catch (error) {
      console.error("Failed to decode JWT:", error);
      return null;
   }
};

export function useToken() {
   // Try to get token from router context (SSR-aware)
   const context = useRouteContext({ from: RootRoute.id });
   const contextToken = context?.token;

   // Fallback to session token if context token is not available
   const { data: sessionData, refetch, ...rest } = useSession();

   // Prefer context token, fallback to session token
   const token = contextToken;
   console.log("token from useToken", token);

   useEffect(() => {
      if (!sessionData?.session?.expiresAt) return;
      const expiresAt = new Date(sessionData.session.expiresAt).getTime();
      const expiresIn = expiresAt - Date.now();

      // Refetch 60 seconds before expiration
      if (expiresIn > 60000) {
         const timeout = setTimeout(() => refetch(), expiresIn - 60000);
         return () => clearTimeout(timeout);
      }
   }, [sessionData, refetch]);

   return { ...rest, data: sessionData, token };
}
