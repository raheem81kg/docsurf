import { cn } from "@docsurf/ui/lib/utils";
import type { ToolInvocation } from "ai";
import { ChevronDown, Loader2, Wrench } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Codeblock } from "../codeblock";
import DOMPurify from "dompurify";

export const GenericToolRenderer = memo(({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
   const [isExpanded, setIsExpanded] = useState(false);
   const contentRef = useRef<HTMLDivElement>(null);
   const innerRef = useRef<HTMLDivElement>(null);

   const isLoading = toolInvocation.state === "partial-call" || toolInvocation.state === "call";
   const hasResults = toolInvocation.state === "result" && toolInvocation.result;

   useEffect(() => {
      if (!contentRef.current || !innerRef.current) return;

      const observer = new ResizeObserver(() => {
         if (contentRef.current && innerRef.current && isExpanded) {
            contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
         }
      });

      observer.observe(innerRef.current);

      if (isExpanded) {
         contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
      }

      return () => observer.disconnect();
   }, [isExpanded]);

   // Special rendering for get_current_document_html
   if (toolInvocation.toolName === "get_current_document" && toolInvocation.state === "result" && toolInvocation.result?.success) {
      const { html, metadata } = toolInvocation.result;
      return (
         <div className="w-full">
            <button
               type="button"
               onClick={() => setIsExpanded(!isExpanded)}
               className="flex w-full cursor-pointer items-center gap-2 text-left"
               disabled={isLoading}
            >
               <div className="flex flex-1 items-center gap-2">
                  {isLoading ? <Loader2 className="size-4 animate-spin text-primary" /> : <Wrench className="size-4 text-primary" />}
                  <span className="font-medium text-primary">{metadata?.title || "Untitled Document"}</span>
                  {!isLoading && (
                     <div className={cn("ml-auto transform transition-transform", isExpanded ? "rotate-180" : "")}>
                        <ChevronDown className="size-4 text-foreground" />
                     </div>
                  )}
               </div>
            </button>
            <div
               className={cn("overflow-hidden transition-[max-height] duration-150 ease-out", "my-4 rounded-lg border bg-muted/50")}
               ref={contentRef}
               style={{ maxHeight: isExpanded ? contentRef.current?.scrollHeight : "0px" }}
            >
               <div ref={innerRef} className="text-muted-foreground">
                  <div className="mb-2 flex flex-col gap-1 p-4 pb-0">
                     <span className="text-xs text-muted-foreground">
                        {metadata?.documentType || "Unknown type"}
                        {metadata?.updatedAt && <> | Last updated: {new Date(metadata.updatedAt).toLocaleString()}</>}
                        {metadata?.isLocked && <span className="ml-2 text-red-500">Locked</span>}
                        {metadata?.isPublic && <span className="ml-2 text-green-600">Public</span>}
                     </span>
                  </div>
                  {/* eslint-disable-next-line react/no-danger */}
                  {/** biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
                  <div
                     className="prose max-w-none mt-4 p-4 pt-0"
                     // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                     dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || "") }}
                  />
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="w-full">
         <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full cursor-pointer items-center gap-2 text-left"
            disabled={isLoading}
         >
            <div className="flex flex-1 items-center gap-2">
               {isLoading ? <Loader2 className="size-4 animate-spin text-primary" /> : <Wrench className="size-4 text-primary" />}
               <span className="font-medium text-primary">{toolInvocation.toolName}</span>

               {!isLoading && hasResults && (
                  <div className={cn("ml-auto transform transition-transform", isExpanded ? "rotate-180" : "")}>
                     <ChevronDown className="size-4 text-foreground" />
                  </div>
               )}
            </div>
         </button>

         <div
            ref={contentRef}
            className={cn("overflow-hidden transition-[max-height] duration-150 ease-out", "my-4 rounded-lg border bg-muted/50")}
            style={{
               maxHeight: isExpanded ? contentRef.current?.scrollHeight : "0px",
            }}
         >
            <div ref={innerRef} className="text-muted-foreground">
               {hasResults && (
                  <div className="scrollbar-thin max-h-full overflow-y-auto px-3 pt-3 pb-3">
                     <span className="font-medium text-foreground text-sm">Arguments</span>
                     <div className="mt-2 mb-3">
                        <Codeblock className="language-json" disable={{ expand: true }} default={{ wrap: true }}>
                           {JSON.stringify(toolInvocation.args, null, 2)}
                        </Codeblock>
                     </div>

                     {toolInvocation.result && (
                        <>
                           <span className="font-medium text-foreground text-sm">Result</span>
                           <div className="mt-2 mb-3">
                              <Codeblock className="language-json" disable={{ expand: true }} default={{ wrap: true }}>
                                 {JSON.stringify(toolInvocation.result, null, 2)}
                              </Codeblock>
                           </div>
                        </>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
});

GenericToolRenderer.displayName = "GenericToolRenderer";
