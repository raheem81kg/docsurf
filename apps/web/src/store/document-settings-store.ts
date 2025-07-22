import { createWithEqualityFn } from "zustand/traditional";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";

export type DocumentFont = "sans" | "serif" | "mono" | "lato";

export const FONT_OPTIONS = [
   { label: "Sans (Inter)", value: "sans", className: "font-sans", previewLabel: "Default" },
   { label: "Lato (Slack Canvas)", value: "lato", className: "font-lato", previewLabel: "Lato" },
   { label: "Serif (Merriweather)", value: "serif", className: "font-serif", previewLabel: "Serif" },
   { label: "Mono (Source Code Pro)", value: "mono", className: "font-mono", previewLabel: "Mono" },
] as const satisfies readonly {
   label: string;
   value: DocumentFont;
   className: string;
   previewLabel: string;
}[];

export const APPLY_FONT_TO_HEADER = true;

interface DocumentSettingsState {
   defaultFont: DocumentFont;
   setDefaultFont: (font: DocumentFont) => void;
   fullWidth: boolean;
   setFullWidth: (value: boolean) => void;
}

const DOCUMENT_SETTINGS_KEY = "document-settings-storage" as const;

export const useDocumentSettings = createWithEqualityFn<DocumentSettingsState>()(
   persist(
      (set) => ({
         defaultFont: "sans",
         setDefaultFont: (font) => set({ defaultFont: font }),
         fullWidth: false,
         setFullWidth: (value) => set({ fullWidth: value }),
      }),
      {
         name: DOCUMENT_SETTINGS_KEY,
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({ defaultFont: state.defaultFont, fullWidth: state.fullWidth }),
      }
   ),
   shallow
);

// Sync Zustand store across tabs when localStorage changes
if (typeof window !== "undefined") {
   window.addEventListener("storage", (event) => {
      if (event.key === DOCUMENT_SETTINGS_KEY) {
         const newState = event.newValue ? JSON.parse(event.newValue).state : undefined;
         if (newState) {
            const current = useDocumentSettings.getState();
            if (typeof newState.defaultFont === "string" && newState.defaultFont !== current.defaultFont) {
               useDocumentSettings.setState({ defaultFont: newState.defaultFont });
            }
            if (typeof newState.fullWidth === "boolean" && newState.fullWidth !== current.fullWidth) {
               useDocumentSettings.setState({ fullWidth: newState.fullWidth });
            }
         }
      }
   });
}
