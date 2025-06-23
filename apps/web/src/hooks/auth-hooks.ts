import { authClient } from "@/lib/auth-client";
import { skipToken, useMutation, useQuery, useQueryClient, type AnyUseQueryOptions, type QueryKey } from "@tanstack/react-query";
import type { BetterFetchOption, BetterFetchResponse } from "better-auth/react";
import { useCallback, useEffect, useMemo } from "react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";

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

// Token Management
export const decodeJwt = (token: string) => {
   const decode = (data: string) => {
      if (typeof Buffer === "undefined") {
         return atob(data);
      }
      return Buffer.from(data, "base64").toString();
   };
   const parts = token.split(".").map((part) => decode(part.replace(/-/g, "+").replace(/_/g, "/")));

   return JSON.parse(parts[1]);
};

export function useToken() {
   const { data: sessionData, refetch, ...rest } = useSession();

   const token = sessionData?.session?.token;

   const payload = useMemo(() => {
      if (!token) return null;
      try {
         return decodeJwt(token);
      } catch (error) {
         console.error("Failed to decode JWT:", error);
         return null;
      }
   }, [token]);

   useEffect(() => {
      if (!payload?.exp) return;
      const expiresAt = payload.exp * 1000;
      const expiresIn = expiresAt - Date.now();
      if (expiresIn <= 60000) return;
      const timeout = setTimeout(() => refetch(), expiresIn - 60000);
      return () => clearTimeout(timeout);
   }, [payload, refetch]);

   useEffect(() => {
      if (sessionData?.user?.id && payload?.sub && payload.sub !== sessionData.user.id) {
         refetch();
      }
   }, [payload, sessionData, refetch]);

   const isTokenExpired = useCallback(() => {
      if (!payload?.exp) return true;
      return payload.exp < Date.now() / 1000;
   }, [payload]);

   const tokenData = useMemo(
      () => (isTokenExpired() || sessionData?.user?.id !== payload?.sub ? undefined : sessionData),
      [sessionData, isTokenExpired, payload]
   );

   return { ...rest, data: tokenData, token: tokenData?.session?.token, payload };
}
