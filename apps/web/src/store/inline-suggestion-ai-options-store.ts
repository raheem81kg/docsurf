import { createWithEqualityFn } from "zustand/traditional";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";

export const AI_STORAGE_KEY = "inline-suggestion-ai-options-storage" as const;

// Character limits to prevent exceeding LLM context window
export const LIMITS = {
   CUSTOM_INSTRUCTIONS_MAX: 1000,
   WRITING_SAMPLE_MIN: 200,
   WRITING_SAMPLE_MAX: 5000,
   WRITING_STYLE_SUMMARY_MAX: 2000,
} as const;

export type SuggestionLength = "short" | "medium" | "long" | undefined;

interface InlineSuggestionAiOptionsState {
   suggestionLength: SuggestionLength;
   customInstructions: string;
   writingSample: string;
   writingStyleSummary: string;
   applyStyle: boolean;
   setSuggestionLength: (length: SuggestionLength) => void;
   setCustomInstructions: (instructions: string) => void;
   setWritingSample: (sample: string) => void;
   setWritingStyleSummary: (summary: string) => void;
   setApplyStyle: (val: boolean) => void;
   syncFromStorage: () => void;
}

// Type guard for SuggestionLength
const isSuggestionLength = (value: unknown): value is SuggestionLength =>
   value === undefined || (typeof value === "string" && ["short", "medium", "long"].includes(value));

// Create the store
export const useInlineSuggestionAiOptions = createWithEqualityFn<InlineSuggestionAiOptionsState>()(
   persist(
      (set) => ({
         suggestionLength: undefined,
         customInstructions: "",
         writingSample: "",
         writingStyleSummary: "",
         applyStyle: true,
         setSuggestionLength: (length) => set({ suggestionLength: length }),
         setCustomInstructions: (instructions) =>
            set({
               customInstructions: instructions.slice(0, LIMITS.CUSTOM_INSTRUCTIONS_MAX),
            }),
         setWritingSample: (sample) =>
            set({
               writingSample: sample.slice(0, LIMITS.WRITING_SAMPLE_MAX),
            }),
         setWritingStyleSummary: (summary) =>
            set({
               writingStyleSummary: summary.slice(0, LIMITS.WRITING_STYLE_SUMMARY_MAX),
            }),
         setApplyStyle: (val) => set({ applyStyle: val }),
         syncFromStorage: () => {
            try {
               const stored = localStorage.getItem(AI_STORAGE_KEY);
               if (!stored) return;

               const data = JSON.parse(stored);
               const length = data?.state?.suggestionLength;
               const instructions = data?.state?.customInstructions;
               const writingSample = data?.state?.writingSample;
               const writingStyleSummary = data?.state?.writingStyleSummary;
               const applyStyle = data?.state?.applyStyle;

               set({
                  suggestionLength: isSuggestionLength(length) ? length : undefined,
                  customInstructions: typeof instructions === "string" ? instructions : "",
                  writingSample: typeof writingSample === "string" ? writingSample : "",
                  writingStyleSummary: typeof writingStyleSummary === "string" ? writingStyleSummary : "",
                  applyStyle: typeof applyStyle === "boolean" ? applyStyle : true,
               });
            } catch (error) {
               console.error("Failed to sync AI options from storage:", error);
            }
         },
      }),
      {
         name: AI_STORAGE_KEY,
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({
            suggestionLength: state.suggestionLength,
            customInstructions: state.customInstructions,
            writingSample: state.writingSample,
            writingStyleSummary: state.writingStyleSummary,
            applyStyle: state.applyStyle,
         }),
      }
   ),
   shallow
);

// Set up storage event listener for cross-tab synchronization
if (typeof window !== "undefined") {
   window.addEventListener("storage", (e) => {
      if (e.key === AI_STORAGE_KEY) {
         useInlineSuggestionAiOptions.getState().syncFromStorage();
      }
   });
}

// Export a type-safe selector hook with proper caching
export const useAiOptionsValue = () =>
   useInlineSuggestionAiOptions((state) => ({
      suggestionLength: state.suggestionLength,
      customInstructions: state.customInstructions,
      writingSample: state.writingSample,
      writingStyleSummary: state.writingStyleSummary,
      applyStyle: state.applyStyle,
   }));
