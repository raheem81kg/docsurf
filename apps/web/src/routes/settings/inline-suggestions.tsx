import { Card } from "@docsurf/ui/components/card";
import { Label } from "@docsurf/ui/components/label";
import { Switch } from "@docsurf/ui/components/switch";
import { Button } from "@docsurf/ui/components/button";
import { Textarea } from "@docsurf/ui/components/textarea";
import { Progress } from "@docsurf/ui/components/progress";
import { Separator } from "@docsurf/ui/components/separator";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SettingsLayout } from "@/components/sandbox/right-inner/chat/settings/settings-layout";
import { useInlineSuggestionAiOptions, type SuggestionLength, LIMITS } from "@/store/inline-suggestion-ai-options-store";
import { cn } from "@docsurf/ui/lib/utils";

export const Route = createFileRoute("/settings/inline-suggestions")({
   component: InlineSuggestionsSettings,
});

function InlineSuggestionsSettings() {
   const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
   const [generationError, setGenerationError] = useState<string | null>(null);
   const {
      suggestionLength,
      customInstructions,
      writingSample,
      writingStyleSummary,
      applyStyle,
      setSuggestionLength,
      setCustomInstructions,
      setWritingSample,
      setWritingStyleSummary,
      setApplyStyle,
   } = useInlineSuggestionAiOptions();

   const isEditingSample = !writingStyleSummary;

   const handleSuggestionLengthChange = (length: SuggestionLength) => {
      if (length === suggestionLength) return;
      setSuggestionLength(length);
   };

   const handleCustomInstructionsChange = (instructions: string) => {
      setCustomInstructions(instructions);
   };

   const handleWritingSampleChange = (sample: string) => {
      setWritingSample(sample);
      setGenerationError(null);
   };

   const handleGenerateSummary = async () => {
      if (!writingSample || writingSample.trim().length < LIMITS.WRITING_SAMPLE_MIN) {
         setGenerationError(`Please provide at least ${LIMITS.WRITING_SAMPLE_MIN} characters of sample text.`);
         return;
      }

      setIsGeneratingSummary(true);
      setGenerationError(null);

      try {
         const res = await fetch("/api/user-style", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sampleText: writingSample }),
         });

         if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to analyze writing style");
         }

         const { summary } = await res.json();
         setWritingStyleSummary(summary);
         toast.success("Writing style analyzed successfully");
      } catch (error) {
         const errorMessage = error instanceof Error ? error.message : "Failed to analyze writing style";
         toast.error(errorMessage);
         setGenerationError(errorMessage);
         console.error("Style analysis error:", error);
      } finally {
         setIsGeneratingSummary(false);
      }
   };

   const handleClearProfile = () => {
      setWritingStyleSummary("");
      setWritingSample("");
      setGenerationError(null);
      toast.success("Writing profile cleared");
   };

   const startRetrain = () => {
      setWritingStyleSummary("");
      setGenerationError(null);
   };

   //    const handleWritingStyleSummaryChange = (summary: string) => {
   //       setWritingStyleSummary(summary);
   //    };

   const handleApplyStyleToggle = (apply: boolean) => {
      setApplyStyle(apply);
      toast.success(`Writing style ${apply ? "enabled" : "disabled"}`);
   };

   // Helper function to get character count styling
   const getCharCountStyle = (current: number, max: number) => {
      const ratio = current / max;
      if (ratio >= 1) return "text-destructive";
      if (ratio >= 0.9) return "text-orange-600";
      if (ratio >= 0.8) return "text-yellow-600";
      return "text-muted-foreground";
   };

   const suggestionLengthOptions: { id: SuggestionLength; name: string; description: string }[] = [
      {
         id: undefined,
         name: "Auto",
         description: "Let AI choose the optimal length",
      },
      {
         id: "short",
         name: "Short",
         description: "About 1-8 words",
      },
      {
         id: "medium",
         name: "Medium",
         description: "About 8-12 words",
      },
      {
         id: "long",
         name: "Long",
         description: "At least 12 words",
      },
   ];

   return (
      <SettingsLayout
         title="Inline Suggestions"
         description="Configure AI-powered inline text completion preferences and writing style."
      >
         <div className="space-y-8">
            {/* Suggestion Length Section */}
            <div className="space-y-4">
               <div>
                  <h3 className="font-semibold text-foreground">Suggestion Length</h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                     Choose how long the AI suggestions should be when completing your text
                  </p>
               </div>

               <div className="flex items-center gap-2 max-w-md">
                  {suggestionLengthOptions.map((option) => (
                     <Button
                        key={option.id ?? "auto"}
                        variant={suggestionLength === option.id ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                           "flex-1 h-9 text-sm capitalize",
                           suggestionLength === option.id ? "font-semibold" : "text-muted-foreground"
                        )}
                        onClick={() => handleSuggestionLengthChange(option.id)}
                     >
                        {option.name}
                     </Button>
                  ))}
               </div>
               <div className="text-muted-foreground text-xs max-w-md">
                  {suggestionLengthOptions.find((opt) => opt.id === suggestionLength)?.description ||
                     "Let AI choose the optimal length"}
               </div>
            </div>

            {/* Custom Instructions Section */}
            <div className="space-y-4">
               <div>
                  <h3 className="font-semibold text-foreground">Custom Instructions</h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                     Provide specific guidance for how the AI should complete your text
                  </p>
               </div>

               <Card className="p-4">
                  <div className="space-y-3">
                     <Label htmlFor="custom-instructions" className="text-base">
                        Instructions
                     </Label>
                     <Textarea
                        id="custom-instructions"
                        placeholder="e.g., Write in a professional tone, use technical language, avoid contractions..."
                        value={customInstructions}
                        onChange={(e) => handleCustomInstructionsChange(e.target.value)}
                        rows={3}
                        className="resize-none"
                        maxLength={LIMITS.CUSTOM_INSTRUCTIONS_MAX}
                     />
                     <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">These instructions will be applied to all inline suggestions</span>
                        <span className={getCharCountStyle(customInstructions.length, LIMITS.CUSTOM_INSTRUCTIONS_MAX)}>
                           {customInstructions.length}/{LIMITS.CUSTOM_INSTRUCTIONS_MAX}
                        </span>
                     </div>
                  </div>
               </Card>
            </div>

            <Separator />

            {/* Writing Style Section */}
            <div className="space-y-4">
               <div>
                  <h3 className="font-semibold text-foreground">Writing Style Training</h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                     Train the AI to match your personal writing style by analyzing your text
                  </p>
               </div>

               <Card className="p-4">
                  {isEditingSample ? (
                     <div className="space-y-4">
                        <div>
                           <Label htmlFor="writing-sample" className="text-sm font-medium">
                              Writing Sample
                           </Label>
                           <p className="mt-1 text-muted-foreground text-xs">
                              Paste {LIMITS.WRITING_SAMPLE_MIN}-{LIMITS.WRITING_SAMPLE_MAX} characters of your writing so the AI can
                              learn your style
                           </p>
                        </div>

                        <Textarea
                           id="writing-sample"
                           placeholder="Paste a sample of your writing here. Include 2-3 paragraphs for best results..."
                           value={writingSample}
                           onChange={(e) => handleWritingSampleChange(e.target.value)}
                           disabled={isGeneratingSummary}
                           rows={6}
                           className="resize-none"
                           maxLength={LIMITS.WRITING_SAMPLE_MAX}
                        />

                        <div className="flex justify-between items-center">
                           <Progress
                              value={Math.min(100, (writingSample.length / LIMITS.WRITING_SAMPLE_MIN) * 100)}
                              className="h-2 flex-1 mr-3"
                           />
                           <span
                              className={cn(
                                 "text-xs whitespace-nowrap",
                                 getCharCountStyle(writingSample.length, LIMITS.WRITING_SAMPLE_MAX)
                              )}
                           >
                              {writingSample.length}/{LIMITS.WRITING_SAMPLE_MAX}
                           </span>
                        </div>

                        {generationError && <p className="text-destructive text-xs">{generationError}</p>}

                        <Button
                           className="w-full"
                           variant="outline"
                           disabled={isGeneratingSummary || writingSample.length < LIMITS.WRITING_SAMPLE_MIN}
                           onClick={handleGenerateSummary}
                        >
                           {isGeneratingSummary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {isGeneratingSummary ? "Analyzing Style..." : "Train Writing Style"}
                        </Button>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Apply Writing Style</Label>
                              <div className="text-muted-foreground text-xs">
                                 Use your trained writing style to influence AI suggestions
                              </div>
                           </div>
                           <Switch checked={applyStyle} onCheckedChange={handleApplyStyleToggle} />
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3">
                           <Label className="text-sm font-medium">Style Summary</Label>
                           <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{writingStyleSummary}</p>
                        </div>

                        <div className="flex items-center gap-2">
                           <Button variant="secondary" size="sm" className="flex-1" onClick={startRetrain}>
                              Retrain
                           </Button>
                           <Button variant="destructive" size="sm" className="flex-1" onClick={handleClearProfile}>
                              Clear
                           </Button>
                        </div>
                     </div>
                  )}
               </Card>
            </div>
         </div>
      </SettingsLayout>
   );
}
