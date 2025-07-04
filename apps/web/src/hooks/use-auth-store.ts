// Zustand store for managing the authentication token
import { create } from "zustand";

interface AuthTokenState {
   token: string | null;
   setToken: (token: string | null) => void;
   refetchToken: () => Promise<void>;
}

export const useAuthTokenStore = create<AuthTokenState>((set) => ({
   token: null,
   setToken: (token) => set({ token }),
   refetchToken: async () => {
      try {
         const response = await fetch("/api/fetchToken", { method: "GET" });
         if (!response.ok) {
            set({ token: null });
            return;
         }
         const data = await response.json();
         set({ token: data.token ?? null });
      } catch (error) {
         console.error("Error fetching token", error);
         set({ token: null });
      }
   },
}));
