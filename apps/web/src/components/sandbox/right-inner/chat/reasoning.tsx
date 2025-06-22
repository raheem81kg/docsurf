import { cn } from "@docsurf/ui/lib/utils";
import { Brain, ChevronDownIcon } from "lucide-react";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { MemoizedMarkdown } from "./memoized-markdown";

type ReasoningContextType = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

const ReasoningContext = createContext<ReasoningContextType | undefined>(undefined);

function useReasoningContext() {
   const context = useContext(ReasoningContext);
   if (!context) {
      throw new Error("useReasoningContext must be used within a Reasoning provider");
   }
   return context;
}

export type ReasoningProps = {
   children: React.ReactNode;
   className?: string;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   isStreaming?: boolean;
};
function Reasoning({ children, className, open, onOpenChange, isStreaming }: ReasoningProps) {
   const [internalOpen, setInternalOpen] = useState(false);
   const [wasAutoOpened, setWasAutoOpened] = useState(false);

   const isControlled = open !== undefined;
   const isOpen = isControlled ? open : internalOpen;

   const handleOpenChange = (newOpen: boolean) => {
      if (!isControlled) {
         setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
   };

   useEffect(() => {
      if (isStreaming && !wasAutoOpened) {
         if (!isControlled) setInternalOpen(true);
         setWasAutoOpened(true);
      }

      if (!isStreaming && wasAutoOpened) {
         if (!isControlled) setInternalOpen(false);
         setWasAutoOpened(false);
      }
   }, [isStreaming, wasAutoOpened, isControlled]);

   return (
      <ReasoningContext.Provider
         value={{
            isOpen,
            onOpenChange: handleOpenChange,
         }}
      >
         <div className={className}>{children}</div>
      </ReasoningContext.Provider>
   );
}

export type ReasoningTriggerProps = {
   children: React.ReactNode;
   className?: string;
} & React.HTMLAttributes<HTMLButtonElement>;

function ReasoningTrigger({ children, className, ...props }: ReasoningTriggerProps) {
   const { isOpen, onOpenChange } = useReasoningContext();

   return (
      <button
         className={cn("flex w-full cursor-pointer items-center gap-2", className)}
         onClick={() => onOpenChange(!isOpen)}
         {...props}
      >
         <Brain className="size-4 text-primary" />
         <span className="text-primary">{children}</span>
         <div className={cn("ml-auto transform transition-all duration-200", isOpen ? "rotate-180" : "")}>
            <ChevronDownIcon className="size-4" />
         </div>
      </button>
   );
}

export type ReasoningContentProps = {
   children: React.ReactNode;
   className?: string;
   markdown?: boolean;
   contentClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function ReasoningContent({ children, className, contentClassName, markdown = false, ...props }: ReasoningContentProps) {
   const contentRef = useRef<HTMLDivElement>(null);
   const innerRef = useRef<HTMLDivElement>(null);
   const { isOpen } = useReasoningContext();

   useEffect(() => {
      if (!contentRef.current || !innerRef.current) return;

      const observer = new ResizeObserver(() => {
         if (contentRef.current && innerRef.current && isOpen) {
            contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
         }
      });

      observer.observe(innerRef.current);

      if (isOpen) {
         contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
      }

      return () => observer.disconnect();
   }, [isOpen]);

   const content = markdown ? <MemoizedMarkdown content={children as string} id={"reasoning-content"} /> : children;

   return (
      <div
         ref={contentRef}
         className={cn("overflow-hidden transition-[max-height] duration-150 ease-out", className)}
         style={{
            maxHeight: isOpen ? contentRef.current?.scrollHeight : "0px",
         }}
         {...props}
      >
         <div ref={innerRef} className={cn("prose prose-sm dark:prose-invert text-muted-foreground", contentClassName)}>
            {content}
         </div>
      </div>
   );
}

export { Reasoning, ReasoningTrigger, ReasoningContent };
