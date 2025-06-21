import { create } from "zustand";

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
   // Default values
   l_sidebar_state: true, // Left sidebar defaults to true
   r_sidebar_state: false,
   ir_sidebar_state: false,

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
