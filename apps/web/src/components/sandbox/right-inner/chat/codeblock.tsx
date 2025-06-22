import { Button } from "@docsurf/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@docsurf/ui/components/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { useCodeHighlighter } from "./hooks/use-code-highlighter";
import { cn } from "@docsurf/ui/lib/utils";
import { copyToClipboard } from "./lib/utils";
import { AlignLeft, CheckIcon, ChevronDown, ChevronUp, CopyIcon, WrapText } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { type ArtifactLanguage, ArtifactPreview, isArtifactSupported } from "./artifact-preview";

export const Codeblock = memo(
   ({
      node,
      inline,
      className,
      children,
      disable,
      default: defaultProps,
      ...props
   }: {
      node?: any;
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
      disable?: {
         copy?: boolean;
         expand?: boolean;
         wrap?: boolean;
      };
      default?: {
         expand?: boolean;
         wrap?: boolean;
      };
   }) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "plaintext";

      const [isMultiLine, lineNumber] = useMemo(() => {
         const lines =
            [...(Array.isArray(children) ? children : [children])]
               .filter((x: any) => typeof x === "string")
               .join("")
               .match(/\n/g)?.length ?? 0;
         return [lines > 1, lines];
      }, [children]);

      const [didRecentlyCopied, setDidRecentlyCopied] = useState(false);
      const [expanded, setExpanded] = useState(defaultProps?.expand ?? false);
      const [wrapped, setWrapped] = useState(defaultProps?.wrap ?? false);
      const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

      const codeString = useMemo(() => {
         return [...(Array.isArray(children) ? children : [children])].filter((x: any) => typeof x === "string").join("");
      }, [children]);
      console.log(codeString);

      const supportsArtifact = useMemo(() => {
         return isArtifactSupported(language);
      }, [language]);

      const { highlightedCode } = useCodeHighlighter({
         codeString,
         language,
         expanded,
         wrapped,
         inline,
         shouldHighlight: !inline && (!!match || isMultiLine),
      });

      if (!children) return null;

      return !inline && (match || isMultiLine) ? (
         <div className="relative mt-1 mb-1 flex flex-col overflow-hidden rounded-lg border border-border">
            {supportsArtifact ? (
               <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "code" | "preview")} className="gap-0">
                  <div className="flex items-center gap-2 rounded-t-md border-border border-b bg-muted px-2 py-1">
                     <span className="pl-2 font-mono text-muted-foreground text-xs">{language}</span>
                     {lineNumber >= 16 && (
                        <span className="pt-0.5 pl-2 font-mono text-muted-foreground/50 text-xs">{lineNumber + 1} lines</span>
                     )}

                     <TabsList className="h-7 p-0.5">
                        <TabsTrigger value="code" className="h-6 px-2 text-xs shadow-none">
                           Code
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="h-6 px-2 text-xs shadow-none">
                           Preview
                        </TabsTrigger>
                     </TabsList>
                     <div className="flex-grow" />

                     {lineNumber >= 16 && !disable?.expand && activeTab === "code" && (
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-[1.5rem] w-[1.5rem] text-muted-foreground"
                                 onClick={() => setExpanded((t) => !t)}
                              >
                                 {expanded ? <ChevronUp className="!size-4" /> : <ChevronDown className="!size-4" />}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>{expanded ? "Collapse" : "Expand"}</TooltipContent>
                        </Tooltip>
                     )}
                     {!disable?.wrap && activeTab === "code" && (
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-[1.5rem] w-[1.5rem] text-muted-foreground"
                                 onClick={() => setWrapped((t) => !t)}
                              >
                                 {wrapped ? <WrapText className="!size-4" /> : <AlignLeft className="!size-4" />}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>{wrapped ? "Unwrap lines" : "Wrap lines"}</TooltipContent>
                        </Tooltip>
                     )}
                     {!disable?.copy && (
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-[1.5rem] w-[1.5rem] text-muted-foreground"
                                 onClick={() => {
                                    copyToClipboard(codeString);
                                    setDidRecentlyCopied(true);
                                    setTimeout(() => {
                                       setDidRecentlyCopied(false);
                                    }, 1000);
                                 }}
                              >
                                 {didRecentlyCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>{didRecentlyCopied ? "Copied!" : "Copy code"}</TooltipContent>
                        </Tooltip>
                     )}
                  </div>

                  <TabsContent value="code" className="mt-0">
                     <div className="relative h-full">
                        <div
                           // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki!!
                           dangerouslySetInnerHTML={{ __html: highlightedCode }}
                           className="shiki-container pl-2 font-mono"
                        />

                        {!expanded && lineNumber > 17 && (
                           <div className="absolute right-0 bottom-0 left-0 flex h-12 justify-center rounded-b-md bg-gradient-to-t from-sidebar via-sidebar/80 to-transparent">
                              <Button
                                 variant="default"
                                 size="sm"
                                 onClick={() => setExpanded(true)}
                                 className="h-[1.5rem] gap-1.5 rounded-md shadow-lg"
                              >
                                 {lineNumber - 17} more lines
                                 <ChevronDown className="!size-4" />
                              </Button>
                           </div>
                        )}
                     </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-0">
                     <ArtifactPreview code={codeString} language={language as ArtifactLanguage} />
                  </TabsContent>
               </Tabs>
            ) : (
               <>
                  <div className="flex items-center gap-2 rounded-t-md border-border border-b bg-muted px-2 py-1">
                     <span className="pl-2 font-mono text-muted-foreground text-xs">{language}</span>
                     {lineNumber >= 16 && (
                        <span className="pt-0.5 pl-2 font-mono text-muted-foreground/50 text-xs">{lineNumber + 1} lines</span>
                     )}
                     <div className="flex-grow" />
                     {lineNumber >= 16 && !disable?.expand && (
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-[1.5rem] w-[1.5rem] text-muted-foreground"
                                 onClick={() => setExpanded((t) => !t)}
                              >
                                 {expanded ? <ChevronUp className="!size-4" /> : <ChevronDown className="!size-4" />}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>{expanded ? "Collapse" : "Expand"}</TooltipContent>
                        </Tooltip>
                     )}
                     {!disable?.wrap && (
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-[1.5rem] w-[1.5rem] text-muted-foreground"
                                 onClick={() => setWrapped((t) => !t)}
                              >
                                 {wrapped ? <WrapText className="!size-4" /> : <AlignLeft className="!size-4" />}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>{wrapped ? "Unwrap lines" : "Wrap lines"}</TooltipContent>
                        </Tooltip>
                     )}
                     {!disable?.copy && (
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-[1.5rem] w-[1.5rem] text-muted-foreground"
                                 onClick={() => {
                                    copyToClipboard(codeString);
                                    setDidRecentlyCopied(true);
                                    setTimeout(() => {
                                       setDidRecentlyCopied(false);
                                    }, 1000);
                                 }}
                              >
                                 {didRecentlyCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>{didRecentlyCopied ? "Copied!" : "Copy code"}</TooltipContent>
                        </Tooltip>
                     )}
                  </div>

                  <div
                     // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki!!
                     dangerouslySetInnerHTML={{ __html: highlightedCode }}
                     className="shiki-container pl-2 font-mono"
                  />

                  {!expanded && lineNumber > 17 && (
                     <div className="absolute right-0 bottom-0 left-0 flex h-16 justify-center rounded-b-md bg-gradient-to-t from-sidebar via-sidebar/80 to-transparent">
                        <Button
                           variant="default"
                           size="sm"
                           onClick={() => setExpanded(true)}
                           className="h-[1.5rem] gap-1.5 rounded-md shadow-lg"
                        >
                           {lineNumber - 17} more lines
                           <ChevronDown className="!size-4" />
                        </Button>
                     </div>
                  )}
               </>
            )}
         </div>
      ) : (
         <code
            className={cn(
               className,
               "rounded-md border border-primary/20 bg-primary/10 px-1 py-0.5 font-medium font-mono text-foreground/80 text-sm leading-4"
            )}
            {...props}
         >
            {children}
         </code>
      );
   }
);
Codeblock.displayName = "Codeblock";
