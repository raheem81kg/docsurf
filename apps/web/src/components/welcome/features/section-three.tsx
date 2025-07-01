import { Button } from "@docsurf/ui/components/button";
import { Check, GripVertical, X } from "lucide-react";
import { motion } from "motion/react";
import docsurfEditorSuggestionDark from "/welcome/docsurf-editor-suggestion.png";
import docsurfEditorSuggestionLight from "/welcome/docsurf-editor-suggestion-light.png";
import { DynamicImage } from "../dynamic-image";
import { CtaLink } from "./cta-link";

export function SectionThree() {
   return (
      <section className="group relative mb-12">
         <div className="container overflow-hidden border border-border p-8 md:p-10 md:pb-0 dark:bg-[#121212]">
            <div className="flex flex-col md:flex-row md:space-x-12">
               <div className="md:mr-8 md:mb-8 md:max-w-[40%] xl:mt-6">
                  <h3 className="mb-4 font-medium text-xl md:text-2xl">AI-powered writing assistance</h3>

                  <p className="text-[#878787] text-sm md:mb-4">
                     Enhance your writing with intelligent suggestions and
                     <br />
                     context-aware completions powered by advanced AI.
                  </p>

                  <div className="flex flex-col space-y-2">
                     <div className="mt-8 flex items-center space-x-2 text-sm">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           width={18}
                           height={13}
                           className="mr-1 min-h-[13px] min-w-[18px]"
                           fill="none"
                        >
                           <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                        </svg>
                        <span className="text-primary">Smart text suggestions as you type</span>
                     </div>
                     <div className="flex items-center space-x-2 text-sm">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           width={18}
                           height={13}
                           className="mr-1 min-h-[13px] min-w-[18px]"
                           fill="none"
                        >
                           <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                        </svg>
                        <span className="text-primary">One-click text improvements & rewrites</span>
                     </div>

                     <div className="flex items-center space-x-2 text-sm">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           width={18}
                           height={13}
                           className="mr-1 min-h-[13px] min-w-[18px]"
                           fill="none"
                        >
                           <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                        </svg>
                        <span className="text-primary">Context-aware completions</span>
                     </div>

                     <div className="hidden items-center space-x-2 text-sm md:flex">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           width={18}
                           height={13}
                           className="mr-1 min-h-[13px] min-w-[18px]"
                           fill="none"
                        >
                           <path fill="currentColor" d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z" />
                        </svg>
                        <span className="text-primary">Version history </span>
                     </div>
                  </div>

                  <div className="absolute bottom-6">
                     <CtaLink text="Start writing with AI" />
                  </div>
               </div>

               <div className="relative mt-8 ml-12 md:mt-0">
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3, delay: 0.7 }}
                     viewport={{ once: true }}
                     className="-left-[60px] absolute top-[120px]"
                  >
                     <div className="demo-suggestion-overlay-animated min-w-[38ch] border border-border bg-background px-3 py-2.5">
                        <div className="demo-overlay-header drag-handle mb-1 flex h-8 cursor-move items-center gap-2">
                           <GripVertical
                              size={14}
                              className="demo-overlay-drag-handle cursor-grab text-muted-foreground/70 active:cursor-grabbing"
                           />
                           <h3 className="font-medium text-xs">Suggestion</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                           <div className="demo-overlay-input-placeholder rounded-[3.5px] border border-border">
                              {/* Text will be animated by CSS ::before */}
                           </div>
                           <div className="demo-overlay-diff-view rounded-[3.5px] border border-border">
                              <span className="text-red-500 line-through dark:text-red-400/70">lacks clarity and strength.</span>
                              <span className="demo-diff-new-text-animated ml-1 text-green-600 dark:text-green-400/70">
                                 lacks punch and impact.
                              </span>
                           </div>
                        </div>

                        <div className="demo-overlay-actions mt-2">
                           <Button variant="ghost" size="sm" className="!py-0.5 h-7 rounded-full px-2 text-xs hover:text-destructive">
                              <X size={13} strokeWidth={2.5} className="mr-1" /> Reject
                           </Button>
                           <Button variant="ghost" size="sm" className="!py-0.5 h-7 rounded-full px-2 text-xs hover:text-primary">
                              <Check size={13} strokeWidth={2.5} className="mr-1" /> Accept
                           </Button>
                        </div>
                     </div>
                  </motion.div>

                  <DynamicImage
                     lightSrc={docsurfEditorSuggestionLight}
                     darkSrc={docsurfEditorSuggestionDark}
                     height={400}
                     className="-mb-[32px] md:-mb-[1px] mt-8 object-contain md:mt-0 md:w-[800px]"
                     alt="AI Writing Assistant"
                  />
               </div>
            </div>
         </div>
      </section>
   );
}
