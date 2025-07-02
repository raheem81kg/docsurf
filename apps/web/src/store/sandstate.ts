import { create } from "zustand";
import { LEFT_SIDEBAR_COOKIE_NAME, RIGHT_SIDEBAR_COOKIE_NAME, INNER_RIGHT_SIDEBAR_COOKIE_NAME } from "@/utils/constants";
import { MOBILE_BREAKPOINT } from "@docsurf/ui/hooks/use-mobile";

// Helper to get cookie value
const getCookie = (name: string): string | null => {
   if (typeof document === "undefined") return null;
   const value = `; ${document.cookie}`;
   const parts = value.split(`; ${name}=`);
   if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
   }
   return null;
};

// Helper to check if mobile (matching the same logic as useIsMobile)
const getIsMobile = (): boolean => {
   if (typeof window === "undefined") return false;
   return window.innerWidth < MOBILE_BREAKPOINT; // MOBILE_BREAKPOINT from useIsMobile
};

const leftSidebarCookie = getCookie(LEFT_SIDEBAR_COOKIE_NAME);
const rightSidebarCookie = getCookie(RIGHT_SIDEBAR_COOKIE_NAME);
const innerRightSidebarCookie = getCookie(INNER_RIGHT_SIDEBAR_COOKIE_NAME);

// On mobile, default to closed. On desktop, default to open if no cookie exists
const isMobile = getIsMobile();
const initialLeftSidebarOpen = isMobile
   ? false // Always closed on mobile
   : leftSidebarCookie === null
   ? true
   : leftSidebarCookie === "true";
const initialRightSidebarOpen = isMobile
   ? false // Always closed on mobile
   : rightSidebarCookie === "true";
const initialInnerRightSidebarOpen = isMobile
   ? false // Always closed on mobile
   : innerRightSidebarCookie === "true";

interface SandStateProps {
   l_sidebar_state: boolean;
   r_sidebar_state: boolean;
   ir_sidebar_state: boolean;
   toggle_l_sidebar: () => void;
   toggle_r_sidebar: () => void;
   toggle_ir_sidebar: () => void;
   set_l_sidebar_state: (value: boolean) => void;
   set_r_sidebar_state: (value: boolean) => void;
   set_ir_sidebar_state: (value: boolean) => void;
   initializeState: (state: { l_sidebar_state?: boolean; r_sidebar_state?: boolean; ir_sidebar_state?: boolean }) => void;
}

export const useSandStateStore = create<SandStateProps>()((set) => ({
   // Synchronously initialized values
   l_sidebar_state: initialLeftSidebarOpen,
   r_sidebar_state: initialRightSidebarOpen,
   ir_sidebar_state: initialInnerRightSidebarOpen,

   toggle_l_sidebar: () =>
      set((state) => ({
         l_sidebar_state: !state.l_sidebar_state,
      })),
   toggle_r_sidebar: () =>
      set((state) => ({
         r_sidebar_state: !state.r_sidebar_state,
      })),
   toggle_ir_sidebar: () =>
      set((state) => ({
         ir_sidebar_state: !state.ir_sidebar_state,
      })),
   set_l_sidebar_state: (value: boolean) => set({ l_sidebar_state: value }),
   set_r_sidebar_state: (value: boolean) => set({ r_sidebar_state: value }),
   set_ir_sidebar_state: (value: boolean) => set({ ir_sidebar_state: value }),
   initializeState: (state) =>
      set((current) => ({
         ...current,
         // Only update if the value is defined (not undefined)
         ...(state.l_sidebar_state !== undefined && { l_sidebar_state: state.l_sidebar_state }),
         ...(state.r_sidebar_state !== undefined && { r_sidebar_state: state.r_sidebar_state }),
         ...(state.ir_sidebar_state !== undefined && { ir_sidebar_state: state.ir_sidebar_state }),
      })),
}));
