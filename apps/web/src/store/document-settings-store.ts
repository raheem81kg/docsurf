import { createWithEqualityFn } from "zustand/traditional";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";

export type DocumentFont = "sans" | "serif" | "mono" | "lato";

interface DocumentSettingsState {
   defaultFont: DocumentFont;
   setDefaultFont: (font: DocumentFont) => void;
}

const DOCUMENT_SETTINGS_KEY = "document-settings-storage" as const;

export const useDocumentSettings = createWithEqualityFn<DocumentSettingsState>()(
   persist(
      (set) => ({
         defaultFont: "sans",
         setDefaultFont: (font) => set({ defaultFont: font }),
      }),
      {
         name: DOCUMENT_SETTINGS_KEY,
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({ defaultFont: state.defaultFont }),
      }
   ),
   shallow
);

// Sync Zustand store across tabs when localStorage changes
if (typeof window !== "undefined") {
   window.addEventListener("storage", (event) => {
      if (event.key === DOCUMENT_SETTINGS_KEY) {
         // Rehydrate the Zustand store with the new value
         const newState = event.newValue ? JSON.parse(event.newValue).state : undefined;
         if (newState && typeof newState.defaultFont === "string") {
            useDocumentSettings.setState({ defaultFont: newState.defaultFont });
         }
      }
   });
}
