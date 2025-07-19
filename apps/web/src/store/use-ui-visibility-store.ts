import { create } from "zustand";

/**
 * UI Visibility Store
 *
 * Manages the visibility of UI elements to prevent conflicts between different menus and overlays.
 *
 * Use cases:
 * - Hide text bubble menu when content menu is open
 * - Hide text bubble menu when suggestion overlay is open
 * - Hide text bubble menu when any other menu/overlay is open
 *
 * Usage:
 * ```tsx
 * const shouldShowTextBubbleMenu = useUIVisibilityStore((state) => state.shouldShowTextBubbleMenu);
 * const setAnyMenuOpen = useUIVisibilityStore((state) => state.setAnyMenuOpen);
 *
 * // In your component's shouldShow logic:
 * if (!shouldShowTextBubbleMenu()) return false;
 *
 * // When opening a menu:
 * setAnyMenuOpen(true);
 *
 * // When closing a menu:
 * setAnyMenuOpen(false);
 * ```
 */
interface UIVisibilityState {
   // Content menu state
   isContentMenuOpen: boolean;

   // Text bubble menu state
   isTextBubbleMenuVisible: boolean;

   // Additional UI states that should hide text bubble menu
   isAnyMenuOpen: boolean;

   // Actions
   setContentMenuOpen: (isOpen: boolean) => void;
   setTextBubbleMenuVisible: (isVisible: boolean) => void;
   setAnyMenuOpen: (isOpen: boolean) => void;

   // Computed getters
   shouldShowTextBubbleMenu: () => boolean;
}

export const useUIVisibilityStore = create<UIVisibilityState>((set, get) => ({
   // Initial state
   isContentMenuOpen: false,
   isTextBubbleMenuVisible: true,
   isAnyMenuOpen: false,

   // Actions
   setContentMenuOpen: (isOpen: boolean) => {
      set({ isContentMenuOpen: isOpen });
   },

   setTextBubbleMenuVisible: (isVisible: boolean) => {
      set({ isTextBubbleMenuVisible: isVisible });
   },

   setAnyMenuOpen: (isOpen: boolean) => {
      set({ isAnyMenuOpen: isOpen });
   },

   // Computed getter - text bubble menu should not show when any menu is open
   shouldShowTextBubbleMenu: () => {
      const { isContentMenuOpen, isTextBubbleMenuVisible, isAnyMenuOpen } = get();
      return isTextBubbleMenuVisible && !isContentMenuOpen && !isAnyMenuOpen;
   },
}));
