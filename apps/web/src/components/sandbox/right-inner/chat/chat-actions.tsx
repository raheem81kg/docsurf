import { cn } from "@docsurf/ui/lib/utils";
import type { UIMessage } from "ai";
import { Check, Copy, Download, Edit3, RotateCcw } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Badge } from "@docsurf/ui/components/badge";
import { Button } from "@docsurf/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { copyToClipboard } from "./lib/utils";
import { env } from "@/env";

export const ChatActions = memo(
   ({
      role,
      message,
      onRetry,
      onEdit,
   }: {
      role: UIMessage["role"];
      message: UIMessage;
      onRetry?: (message: UIMessage) => void;
      onEdit?: (message: UIMessage) => void;
   }) => {
      const [copied, setCopied] = useState(false);

      const modelName: string | undefined = useMemo(() => {
         if (message.role !== "assistant") return undefined;
         if ("metadata" in message && message.metadata) {
            const casted = message.metadata as { modelName?: string };
            if (casted.modelName) return casted.modelName;
         }
         const found = message.annotations?.find(
            (annotation) => annotation && typeof annotation === "object" && "type" in annotation && annotation.type === "model_name"
         );
         if (found && typeof found === "object" && "content" in found) {
            return found.content?.toString();
         }
         return undefined;
      }, [message.annotations?.length, (message as { metadata?: { modelName?: string } }).metadata]);

      const imageGenerationAssets = useMemo(() => {
         const assets: string[] = [];
         message.parts
            .filter((part) => part.type === "tool-invocation")
            .forEach((part) => {
               if (
                  part.toolInvocation.toolName === "image_generation" &&
                  part.toolInvocation.state === "result" &&
                  part.toolInvocation.result?.assets
               ) {
                  part.toolInvocation.result.assets.forEach((asset: any) => {
                     if (asset.imageUrl) {
                        assets.push(asset.imageUrl);
                     }
                  });
               }
            });
         return assets;
      }, [message.parts]);

      const hasImageGeneration = imageGenerationAssets.length > 0;

      const handleCopy = async () => {
         const textContent = message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n");

         await copyToClipboard(textContent);
         setCopied(true);
         setTimeout(() => setCopied(false), 1500);
      };

      const handleDownload = async () => {
         if (imageGenerationAssets.length === 1) {
            const url = `${env.VITE_CONVEX_SITE_URL}/r2?key=${encodeURIComponent(imageGenerationAssets[0])}`;
            window.open(url, "_blank");
         } else {
            imageGenerationAssets.forEach((asset, index) => {
               const url = `${env.VITE_CONVEX_SITE_URL}/r2?key=${encodeURIComponent(asset)}`;
               setTimeout(() => window.open(url, "_blank"), index * 200);
            });
         }
      };

      return (
         <div
            className={cn(
               "absolute flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus:visible md:group-focus:z-10 md:group-focus:opacity-100 md:group-hover:visible md:group-hover:z-10 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
               role === "user" ? "right-0 mt-4" : "left-0 mt-3"
            )}
         >
            {onRetry && (
               <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 border bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-accent hover:text-primary"
                        onClick={() => onRetry(message)}
                     >
                        <RotateCcw className="h-3.5 w-3.5" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                     <p>Retry</p>
                  </TooltipContent>
               </Tooltip>
            )}

            {onEdit && (
               <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 border bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-accent hover:text-primary"
                        onClick={() => onEdit(message)}
                     >
                        <Edit3 className="h-3.5 w-3.5" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                     <p>Edit</p>
                  </TooltipContent>
               </Tooltip>
            )}

            {hasImageGeneration ? (
               <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 border bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-accent hover:text-primary"
                        onClick={handleDownload}
                     >
                        <Download className="h-3.5 w-3.5" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                     <p>Download {imageGenerationAssets.length > 1 ? "Images" : "Image"}</p>
                  </TooltipContent>
               </Tooltip>
            ) : (
               <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 border bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-accent hover:text-primary"
                        onClick={handleCopy}
                     >
                        <div className="relative">
                           <Copy
                              className={`h-3.5 w-3.5 transition-all duration-200 ${
                                 copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
                              }`}
                           />
                           <Check
                              className={`absolute inset-0 h-3.5 w-3.5 transition-all duration-200 ${
                                 copied ? "scale-100 opacity-100" : "scale-75 opacity-0"
                              }`}
                           />
                        </div>
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{copied ? "Copied!" : "Copy"}</TooltipContent>
               </Tooltip>
            )}

            {modelName && (
               <Badge variant="secondary" className="ml-1 h-7">
                  {modelName}
               </Badge>
            )}
         </div>
      );
   }
);

ChatActions.displayName = "ChatActions";
