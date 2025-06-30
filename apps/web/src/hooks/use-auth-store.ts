// Zustand store for managing the authentication token
import { create } from "zustand";
import { fetchToken } from "@/routes/__root";

interface AuthTokenState {
   token: string | null;
   setToken: (token: string | null) => void;
   refetchToken: () => Promise<void>;
}

export const useAuthTokenStore = create<AuthTokenState>((set) => ({
   token: null,
   setToken: (token) => set({ token }),
   refetchToken: async () => {
      const token = await fetchToken();
      set({ token: token ?? null });
   },
}));
