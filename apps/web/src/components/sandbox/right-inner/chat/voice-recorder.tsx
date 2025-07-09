import { Button } from "@docsurf/ui/components/button";
import { cn } from "@docsurf/ui/lib/utils";
import { Loader2, Square } from "lucide-react";
import { memo } from "react";
import type { VoiceRecorderState } from "./hooks/use-voice-recorder";

interface VoiceRecorderProps {
   state: VoiceRecorderState;
   onStop: () => void;
   className?: string;
}

const formatDuration = (seconds: number): string => {
   const mins = Math.floor(seconds / 60);
   const secs = seconds % 60;
   return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Waveform = memo(({ audioLevel, isRecording }: { audioLevel: number; isRecording: boolean }) => {
   const bars = 12;
   const maxHeight = 24;

   return (
      <div className="flex items-center justify-center gap-1">
         {Array.from({ length: bars }).map((_, i) => {
            // Create a wave effect by varying heights based on position and audio level
            const baseHeight = 4;
            const waveOffset = Math.sin((i / bars) * Math.PI * 2) * 0.3;
            const randomVariation = Math.sin(Date.now() * 0.01 + i) * 0.2;
            const height = isRecording ? Math.max(baseHeight, (audioLevel + waveOffset + randomVariation) * maxHeight) : baseHeight;

            return (
               <div
                  key={i.toString()}
                  className={cn("w-1 rounded-full bg-primary transition-all duration-150", isRecording ? "animate-pulse" : "")}
                  style={{
                     height: `${Math.min(height, maxHeight)}px`,
                     opacity: isRecording ? 0.7 + audioLevel * 0.3 : 0.5,
                  }}
               />
            );
         })}
      </div>
   );
});

Waveform.displayName = "Waveform";

export const VoiceRecorder = memo(({ state, onStop, className }: VoiceRecorderProps) => {
   const { isRecording, isTranscribing, recordingDuration, audioLevel } = state;

   return (
      <div
         className={cn(
            "relative flex flex-wrap items-center justify-between gap-4 rounded-t-lg border-2 border-input bg-background/80 p-4 shadow-lg backdrop-blur-lg md:rounded-lg",
            className
         )}
      >
         {/* Left side - Recording indicator and waveform */}
         <div className="flex flex-1 flex-wrap items-center gap-4">
            {isRecording && (
               <div className="flex items-center gap-2">
                  <div className="size-3 animate-pulse rounded-full bg-red-500" />
                  <span className="font-medium text-red-500 text-sm">Recording</span>
               </div>
            )}

            {isTranscribing && (
               <div className="flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin text-primary" />
                  <span className="font-medium text-primary text-sm">Transcribing...</span>
               </div>
            )}

            <Waveform audioLevel={audioLevel} isRecording={isRecording} />
         </div>

         {/* Center - Timer */}
         <div className="font-mono text-foreground text-lg">{formatDuration(recordingDuration)}</div>

         {/* Right side - Stop button */}
         <Button variant="default" size="icon" className="size-8 shrink-0 rounded-md" onClick={onStop} disabled={isTranscribing}>
            {isTranscribing ? <Loader2 className="size-5 animate-spin" /> : <Square className="size-5 fill-current" />}
         </Button>
      </div>
   );
});

VoiceRecorder.displayName = "VoiceRecorder";
