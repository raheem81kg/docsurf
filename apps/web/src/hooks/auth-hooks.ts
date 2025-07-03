import { authClient } from "@/lib/auth-client";
import { skipToken, useMutation, useQuery, useQueryClient, type AnyUseQueryOptions, type QueryKey } from "@tanstack/react-query";
import type { BetterFetchOption, BetterFetchResponse } from "better-auth/react";
import { useCallback } from "react";
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

/**
 * Returns the current router context token. This token is ephemeral and must be used immediately (e.g., directly in a Bearer header).
 * Do NOT store or cache this value for later use.
 */
// export function useEphemeralToken() {
//    const context = useRouteContext({ from: RootRoute.id });
//    const token = context?.token ?? null;
//    return { token };
// }
