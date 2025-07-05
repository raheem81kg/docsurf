"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { X, Check, ChevronDown, GripVertical, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
// import { useUsageStore } from "@/store/use-usage-store";

import { useSuggestionOverlay } from "./suggestion-overlay-provider";

import { cn } from "@docsurf/ui/lib/utils";
// import { useAiOptions } from "@/store/use-ai-options-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@docsurf/ui/components/tooltip";

import type { Editor } from "@tiptap/react";
import { DiffView } from "../../custom/ui/diffview/diffview";

// Add FrameService class for smooth animations
class FrameService {
   private frame: number | null = null;

   debounce = (callback: () => void) => {
      if (this.frame) {
         cancelAnimationFrame(this.frame);
      }

      this.frame = requestAnimationFrame(() => {
         this.frame = null;
         callback();
      });
   };

   cancel = () => {
      if (this.frame) {
         cancelAnimationFrame(this.frame);
         this.frame = null;
      }
   };
}

export interface HighlightedTextProps {
   text: string;
   startIndex: number;
   endIndex: number;
}

interface SuggestionMetadata {
   originalContent?: string;
   pendingSuggestion?: string;
   suggestions?: Array<{
      originalText: string;
      suggestedText: string;
      isResolved: boolean;
      [key: string]: any;
   }>;
   [key: string]: any;
}

interface SuggestionOverlayProps {
   documentId: string;
   workspaceId: string;
   selectedText?: string;
   isOpen: boolean;
   onClose: () => void;
   onAcceptSuggestion: (suggestion: string) => void;
   position?: { x: number; y: number };
   editor?: Editor | null;
   from?: number;
   to?: number;
}

export default function SuggestionOverlay({
   documentId,
   workspaceId,
   selectedText = "",
   isOpen,
   onClose,
   onAcceptSuggestion,
   position = { x: 100, y: 100 },
   editor,
   from,
   to,
}: SuggestionOverlayProps) {
   const [currentPosition, setCurrentPosition] = useState(position);
   const [isDragging, setIsDragging] = useState(false);
   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
   const [isManuallyPositioned, setIsManuallyPositioned] = useState(false);
   const [manualPosition, setManualPosition] = useState<{ x: number; y: number } | null>(null);
   const [inputValue, setInputValue] = useState("");
   const [isGenerating, setIsGenerating] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [originalContent, setOriginalContent] = useState<string | null>(null);
   const [suggestion, setSuggestion] = useState<string>("");
   const [isSelectionExpanded, setIsSelectionExpanded] = useState(false);
   const inputRef = useRef<HTMLInputElement>(null);
   const overlayRef = useRef<HTMLDivElement>(null);
   // const { customInstructions } = useAiOptions();
   const { setSuggestionIsLoading } = useSuggestionOverlay();
   // const { refetchUsage } = useUsageStore();
   const frameServiceRef = useRef<FrameService>(new FrameService());

   // Effect to inform provider about loading state changes
   useEffect(() => {
      setSuggestionIsLoading(isGenerating);
   }, [isGenerating, setSuggestionIsLoading]);

   // Function to truncate text to first 5 words
   const truncateText = (text: string, wordCount = 5) => {
      const words = text.split(/\s+/);
      if (words.length <= wordCount) return text;
      return words.slice(0, wordCount).join(" ") + "...";
   };

   const VERTICAL_GAP = 10;
   const HORIZONTAL_OFFSET = 5;

   // Shared function for calculating overlay position
   const calculateOverlayPosition = useCallback(() => {
      if (!editor || !overlayRef.current) return null;

      const selection = editor.state.selection;
      if (selection.empty) return null;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const overlayWidth = overlayRef.current?.offsetWidth || 0;
      const overlayHeight = overlayRef.current?.offsetHeight || 0;
      const padding = 10;

      // Get coordinates for both start and end of selection
      const startCoords = editor.view.coordsAtPos(selection.from);
      const endCoords = editor.view.coordsAtPos(selection.to);

      // Check if selection is multi-line
      const isMultiLine = Math.abs(endCoords.top - startCoords.top) > 5; // 5px threshold for line height

      // Calculate available space on both sides
      const spaceBelowStart = viewportHeight - startCoords.bottom;
      const spaceAboveStart = startCoords.top;
      const spaceBelowEnd = viewportHeight - endCoords.bottom;
      const spaceAboveEnd = endCoords.top;

      // Calculate horizontal space
      const spaceRightOfStart = viewportWidth - startCoords.right;
      const spaceLeftOfStart = startCoords.left;
      const spaceRightOfEnd = viewportWidth - endCoords.right;
      const spaceLeftOfEnd = endCoords.left;

      // Determine if we should use start or end coordinates
      let useStartCoords = false;
      let positionAbove = false;

      if (isMultiLine) {
         // For multi-line selections, prefer the point with more vertical space
         useStartCoords = spaceBelowStart + spaceAboveStart > spaceBelowEnd + spaceAboveEnd;
      } else {
         // For single-line selections, consider both vertical and horizontal space
         const startScore = Math.min(spaceBelowStart, spaceAboveStart) + Math.min(spaceRightOfStart, spaceLeftOfStart);
         const endScore = Math.min(spaceBelowEnd, spaceAboveEnd) + Math.min(spaceRightOfEnd, spaceLeftOfEnd);
         useStartCoords = startScore > endScore;
      }

      // Check if we need to position above
      if (spaceBelowStart < overlayHeight + VERTICAL_GAP && spaceAboveStart > overlayHeight + VERTICAL_GAP) {
         useStartCoords = true;
         positionAbove = true;
      } else if (spaceBelowEnd < overlayHeight + VERTICAL_GAP && spaceAboveEnd > overlayHeight + VERTICAL_GAP) {
         useStartCoords = false;
         positionAbove = true;
      }

      // When positioning above, always use the start coordinates to avoid blocking the selection
      const coords = positionAbove ? startCoords : useStartCoords ? startCoords : endCoords;

      // Calculate horizontal position with improved edge detection
      let newX = coords.left;
      const spaceRight = viewportWidth - coords.right;
      const spaceLeft = coords.left;

      // If there's more space on the right, align with the left edge
      // If there's more space on the left, align with the right edge
      if (spaceRight < spaceLeft && spaceLeft > overlayWidth + padding) {
         newX = coords.right - overlayWidth;
      }

      // Ensure the overlay stays within viewport bounds horizontally
      newX = Math.max(padding, Math.min(viewportWidth - overlayWidth - padding, newX));

      // Calculate vertical position
      let newY = coords.bottom;
      const spaceBelow = viewportHeight - coords.bottom;
      const spaceAbove = coords.top;

      // Position above if there's not enough space below
      if (positionAbove || (spaceBelow < overlayHeight + VERTICAL_GAP && spaceAbove > overlayHeight + VERTICAL_GAP)) {
         newY = coords.top - overlayHeight - VERTICAL_GAP;
      }

      // Critical fix: Ensure the overlay never goes above the viewport
      newY = Math.max(padding, newY);

      // Also ensure it doesn't go below the viewport
      if (newY + overlayHeight > viewportHeight - padding) {
         newY = viewportHeight - overlayHeight - padding;
      }

      // Final fallback: if the overlay is too tall for the viewport, center it vertically
      if (overlayHeight > viewportHeight - padding * 2) {
         newY = padding;
      }

      return { x: newX, y: newY };
   }, [editor]);

   // Handle both mouse and touch move events
   const handleMove = useCallback(
      (e: MouseEvent | TouchEvent) => {
         if (!isDragging || !overlayRef.current) return;

         e.preventDefault();
         e.stopPropagation();

         frameServiceRef.current.debounce(() => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const overlayWidth = overlayRef.current?.offsetWidth || 0;
            const overlayHeight = overlayRef.current?.offsetHeight || 0;

            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

            let newX = clientX - dragOffset.x;
            let newY = clientY - dragOffset.y;

            // Enhanced viewport bounds constraint with padding
            const padding = 10;

            // Horizontal constraints
            newX = Math.max(padding, Math.min(viewportWidth - overlayWidth - padding, newX));

            // Vertical constraints with better bounds checking
            newY = Math.max(padding, newY);

            // Ensure bottom doesn't go below viewport
            if (newY + overlayHeight > viewportHeight - padding) {
               newY = viewportHeight - overlayHeight - padding;
            }

            // Final safety check for very tall overlays
            if (overlayHeight > viewportHeight - padding * 2) {
               newY = padding;
            }

            setCurrentPosition({ x: newX, y: newY });
            setIsManuallyPositioned(true);
         });
      },
      [isDragging, dragOffset]
   );

   // Update position when overlay opens or position changes
   useEffect(() => {
      if (!isOpen || !overlayRef.current || !editor || isManuallyPositioned) return;

      const updatePosition = () => {
         const newPosition = calculateOverlayPosition();
         if (newPosition) {
            frameServiceRef.current.debounce(() => {
               setCurrentPosition(newPosition);
            });
         }
      };

      // Initial position
      updatePosition();
   }, [isOpen, editor, calculateOverlayPosition, isManuallyPositioned]);

   // Update scroll and resize handlers only if not manually positioned
   useEffect(() => {
      if (isManuallyPositioned) return;

      function handleReposition() {
         frameServiceRef.current.debounce(() => {
            const newPosition = calculateOverlayPosition();
            if (newPosition) {
               setCurrentPosition(newPosition);
            }
         });
      }

      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, true);

      return () => {
         window.removeEventListener("resize", handleReposition);
         window.removeEventListener("scroll", handleReposition, true);
         frameServiceRef.current.cancel();
      };
   }, [isManuallyPositioned, calculateOverlayPosition]);

   // Reset manual positioning when overlay closes
   useEffect(() => {
      if (!isOpen) {
         setIsManuallyPositioned(false);
      }
   }, [isOpen]);

   // Handle both mouse and touch events for dragging
   const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!(e.target as HTMLElement).closest(".drag-handle")) return;

      e.preventDefault();
      e.stopPropagation();

      // Blur the input to prevent focus-related scrolling issues
      if (inputRef.current) {
         inputRef.current.blur();
      }

      setIsDragging(true);

      const rect = overlayRef.current?.getBoundingClientRect();
      if (rect) {
         const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
         const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

         setDragOffset({
            x: clientX - rect.left,
            y: clientY - rect.top,
         });
      }
   }, []);

   // Handle end of drag for both mouse and touch
   const handleDragEnd = useCallback(() => {
      setIsDragging(false);
   }, []);

   // Global scroll prevention during drag
   const preventScroll = useCallback(
      (e: TouchEvent) => {
         if (isDragging) {
            e.preventDefault();
         }
      },
      [isDragging]
   );

   // Add and remove both mouse and touch event listeners
   useEffect(() => {
      if (isDragging) {
         window.addEventListener("mousemove", handleMove);
         window.addEventListener("mouseup", handleDragEnd);
         window.addEventListener("touchmove", handleMove, { passive: false });
         window.addEventListener("touchend", handleDragEnd, { passive: false });
         // Prevent all touch scrolling during drag
         document.body.addEventListener("touchmove", preventScroll, { passive: false });
      }

      return () => {
         window.removeEventListener("mousemove", handleMove);
         window.removeEventListener("mouseup", handleDragEnd);
         window.removeEventListener("touchmove", handleMove);
         window.removeEventListener("touchend", handleDragEnd);
         document.body.removeEventListener("touchmove", preventScroll);
      };
   }, [isDragging, handleMove, handleDragEnd, preventScroll]);

   // Reset state when the overlay opens
   useEffect(() => {
      if (isOpen) {
         setIsGenerating(false);
         setError(null);
         setSuggestion("");
         setOriginalContent(null);

         if (selectedText) {
            setOriginalContent(selectedText);
         }
      }
   }, [isOpen, selectedText]);

   // Focus input when overlay opens
   useEffect(() => {
      if (isOpen && inputRef.current) {
         setTimeout(() => inputRef.current?.focus(), 10);
      }
   }, [isOpen]);

   const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
         if (e.key === "Escape") {
            onClose();
         } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isGenerating && suggestion) {
            // Cmd+Enter to accept suggestion
            setSuggestionIsLoading(true);
            setTimeout(() => onAcceptSuggestion(suggestion), 300);
         } else if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
            // Cmd+Backspace to reject suggestion
            onClose();
         }
      },
      [onClose, isGenerating, suggestion, setSuggestionIsLoading, onAcceptSuggestion]
   );

   /**
    * Checks if the clicked element is part of a selection decoration
    */
   const isClickOnSelectionDecoration = useCallback((element: Node): boolean => {
      return element instanceof HTMLElement && element.classList.contains("selection");
   }, []);

   /**
    * Checks if there's a valid selection in the editor
    */
   const hasValidSelection = useCallback((editor: Editor | null | undefined): boolean => {
      if (!editor) return false;

      const { empty, from, to } = editor.state.selection;
      if (empty) return false;

      const selectedText = editor.state.doc.textBetween(from, to, " ");
      return selectedText.trim().length > 0;
   }, []);

   const handleClickOutside = useCallback(
      (event: MouseEvent) => {
         if (!overlayRef.current) return;

         const clickedElement = event.target as Node;

         // Early returns for cases where we want to keep the overlay open
         if (overlayRef.current.contains(clickedElement)) return;
         if (isClickOnSelectionDecoration(clickedElement)) return;
         if (hasValidSelection(editor)) return;

         // If we get here, it's safe to close the overlay
         onClose();
      },
      [onClose, overlayRef, editor, isClickOnSelectionDecoration, hasValidSelection]
   );

   useEffect(() => {
      if (isOpen) {
         window.addEventListener("keydown", handleKeyDown);
         document.addEventListener("mousedown", handleClickOutside);
      } else {
         window.removeEventListener("keydown", handleKeyDown);
         document.removeEventListener("mousedown", handleClickOutside);
      }

      return () => {
         window.removeEventListener("keydown", handleKeyDown);
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, [isOpen, handleKeyDown, handleClickOutside]);

   const handleSubmitPrompt = useCallback(
      async (prompt: string) => {
         if (!documentId) {
            showToast("No document is currently open", "error");
            return;
         }

         // Don't proceed if no text was selected for suggestion context
         if (!selectedText || selectedText.trim() === "") {
            showToast("Please select text to generate a suggestion for", "warning");
            return;
         }

         setIsGenerating(true);
         setError(null);
         setSuggestion("");
         setOriginalContent(selectedText); // Keep track of original content

         try {
            // Create request body
            const body = {
               documentId,
               workspaceId,
               description: prompt.trim(),
               selectedText,
               aiOptions: {
                  // customInstructions: customInstructions || null,
               },
            };

            console.log("[SuggestionOverlay] Requesting suggestion with options:", {
               // customInstructions: customInstructions ? "(custom)" : "(none)",
            });

            // Make POST request
            const response = await fetch("/api/suggestion", {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify(body),
            });

            if (!response.ok) {
               const errorData = await response.json();
               throw new Error(errorData.message || "Failed to get suggestion");
            }

            if (!response.body) {
               throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
               const { done, value } = await reader.read();
               if (done) break;

               const chunk = decoder.decode(value, { stream: true });
               const lines = chunk.split("\n\n");

               for (const line of lines) {
                  if (line.startsWith("data: ")) {
                     try {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                           case "id":
                              // Document ID confirmation, nothing to do
                              break;

                           case "original":
                              setOriginalContent(data.content);
                              break;

                           case "clear":
                              // Clear current content if needed
                              break;

                           case "suggestion-delta":
                              setSuggestion((prev) => prev + data.content);
                              break;

                           case "error":
                              // Handle rate limit error specifically
                              if (data.code === "RATE_LIMIT_REACHED") {
                                 showToast(data.error || "You've reached your daily limit. Please try again tomorrow.", "warning");
                              } else {
                                 showToast(data.error || "An error occurred while generating the suggestion.", "error");
                              }
                              setError(data.error);
                              setIsGenerating(false);
                              return;

                           case "finish":
                              setIsGenerating(false);
                              setInputValue("");
                              // Refetch usage after getting the suggestion response
                              // refetchUsage();
                              return;

                           default:
                              console.warn("Unknown event type:", data.type);
                        }
                     } catch (err) {
                        console.error("Error parsing event data:", line, err);
                        showToast("Error processing suggestion. Please try again.", "error");
                        setError("Error processing suggestion. Please try again.");
                        setIsGenerating(false);
                        return;
                     }
                  }
               }
            }
         } catch (err) {
            console.error("Error setting up request:", err);
            setError("Failed to connect to suggestion service. Please try again.");
            setIsGenerating(false);
         }
      },
      [documentId, selectedText, workspaceId]
   );

   const handleSubmit = useCallback(
      async (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault();
         await handleSubmitPrompt(inputValue);
      },
      [handleSubmitPrompt, inputValue]
   );

   // Handle accept with a quick pulse animation before applying suggestion
   const handleAcceptSuggestion = useCallback(
      (suggestedText: string) => {
         if (typeof from !== "number" || typeof to !== "number" || !selectedText) return;
         setSuggestionIsLoading(true);
         setTimeout(() => {
            onAcceptSuggestion(suggestedText.trim());
         }, 300);
      },
      [onAcceptSuggestion, setSuggestionIsLoading, from, to, selectedText]
   );

   // Prevent background scroll on mobile when overlay is open
   useEffect(() => {
      const overlay = overlayRef.current;
      if (!isOpen || !overlay) return;

      const handleTouchMove = (e: TouchEvent) => {
         if (!isDragging) {
            e.preventDefault();
            e.stopPropagation();
         }
         // If dragging, allow event for drag logic
      };

      overlay.addEventListener("touchmove", handleTouchMove, { passive: false });
      return () => {
         overlay.removeEventListener("touchmove", handleTouchMove);
      };
   }, [isOpen, isDragging]);

   if (!isOpen || typeof from !== "number" || typeof to !== "number" || !selectedText) return null;

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               ref={overlayRef}
               className={cn(
                  "fixed z-1150 bg-background rounded-none shadow-lg border border-border lg:max-w-[624px] md:max-w-[524px] max-w-[90vw] w-[87vw] overflow-hidden select-none touch-manipulation",
                  isDragging && "pointer-events-none"
               )}
               style={{
                  top: `${currentPosition.y}px`,
                  left: `${currentPosition.x}px`,
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  touchAction: isDragging ? "none" : "auto",
               }}
               onMouseDown={handleDragStart}
               onTouchStart={handleDragStart}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.2 }}
            >
               <div className="pb-3.5 pt-1.5">
                  {/* Header with close button */}
                  <div className="flex justify-between items-center px-3 mb-1">
                     <div className="flex items-center gap-2 drag-handle cursor-move touch-manipulation">
                        <GripVertical size={14} className="text-muted-foreground" />
                        <h3 className="text-xs font-medium">Suggestion</h3>
                     </div>

                     <Tooltip>
                        <TooltipTrigger asChild>
                           <button
                              type="button"
                              onClick={onClose}
                              className="text-muted-foreground hover:text-foreground transition-colors p-2 cursor-pointer touch-manipulation"
                              aria-label="Close"
                           >
                              <X size={16} />
                           </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-1150">
                           <span className="text-xs">⌘+Backspace</span>
                        </TooltipContent>
                     </Tooltip>
                  </div>
                  <div className="space-y-2 px-3">
                     {/* Selected text collapsible section */}
                     {selectedText && (
                        <div className="border rounded-[3.5px] overflow-hidden bg-muted/30">
                           <button
                              type="button"
                              onClick={() => setIsSelectionExpanded(!isSelectionExpanded)}
                              className="w-full px-3 py-2 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer touch-manipulation"
                           >
                              <span className="truncate">{isSelectionExpanded ? "Selected Text" : truncateText(selectedText)}</span>
                              <ChevronDown
                                 size={16}
                                 className={cn("transition-transform", {
                                    "transform rotate-180": isSelectionExpanded,
                                 })}
                              />
                           </button>
                           {isSelectionExpanded && (
                              <div className="px-3 py-2 text-sm border-t max-h-[150px] overflow-y-auto">{selectedText}</div>
                           )}
                        </div>
                     )}

                     {/* Input field */}
                     <div>
                        <input
                           ref={inputRef}
                           type="text"
                           placeholder={selectedText ? "Describe what changes you'd like to make..." : "Select text first..."}
                           // mobile font size to prevent zooming issue
                           className="w-full p-2 rounded-[3.5px] border border-input text-sm bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-ring [font-size:16px] md:text-sm"
                           value={inputValue}
                           onChange={(e) => setInputValue(e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === "Enter" && !isGenerating) {
                                 handleSubmitPrompt(inputValue);
                              }
                           }}
                           onTouchStart={(e) => {
                              // Prevent input from interfering with drag operations
                              e.stopPropagation();
                           }}
                           onTouchMove={(e) => {
                              // Prevent input from causing scroll during drag
                              if (isDragging) {
                                 e.preventDefault();
                                 e.stopPropagation();
                              }
                           }}
                           disabled={isGenerating || !selectedText}
                           draggable={false}
                        />
                     </div>

                     {/* Error message */}
                     {error && (
                        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-sm text-xs text-destructive">
                           {error}
                        </div>
                     )}

                     {/* Diff view for original vs suggestion */}
                     {(isGenerating || suggestion) && originalContent && (
                        <div className="border rounded-lg overflow-hidden bg-muted/30">
                           <div className="p-2 max-h-[300px] overflow-y-auto">
                              <DiffView
                                 oldContent={originalContent}
                                 newContent={suggestion || originalContent} // Show old content while generating
                              />
                           </div>

                           {/* Action buttons - only show on completion */}
                           {!isGenerating && suggestion && (
                              <div className="flex justify-end gap-2 p-2 border-t bg-background/50">
                                 <TooltipProvider>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                          <button
                                             type="button"
                                             onClick={onClose}
                                             className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors text-muted-foreground hover:text-destructive cursor-pointer touch-manipulation"
                                          >
                                             <X size={13} strokeWidth={2.5} />
                                             <span className="text-xs">Reject</span>
                                          </button>
                                       </TooltipTrigger>
                                       <TooltipContent side="top">
                                          <span className="text-xs">⌘+Backspace</span>
                                       </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                          <button
                                             type="button"
                                             onClick={() => handleAcceptSuggestion(suggestion)}
                                             className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors text-muted-foreground hover:text-primary cursor-pointer touch-manipulation"
                                          >
                                             <Check size={13} strokeWidth={2.5} />
                                             <span className="text-xs">Accept</span>
                                          </button>
                                       </TooltipTrigger>
                                       <TooltipContent side="top">
                                          <span className="text-xs">⌘+Enter</span>
                                       </TooltipContent>
                                    </Tooltip>
                                 </TooltipProvider>
                              </div>
                           )}

                           {/* Show loading state with spinner */}
                           {isGenerating && (
                              <div className="flex justify-center items-center p-2 border-t bg-background/50">
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Generating suggestion...</span>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}
