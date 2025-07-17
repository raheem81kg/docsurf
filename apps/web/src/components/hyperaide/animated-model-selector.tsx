// import { useState, useRef, useEffect } from "react";
// import {
//    useFloating,
//    useInteractions,
//    useClick,
//    useDismiss,
//    offset,
//    flip,
//    shift,
//    autoUpdate,
//    FloatingFocusManager,
// } from "@floating-ui/react";
// import { models } from "@/constants/models";
// import { motion } from "motion/react";
// import { CaretDownIcon, SparkleIcon } from "@phosphor-icons/react";
// import { useAuth } from "@/providers/auth-provider";
// import { useModal } from "@/providers/modal-provider";
// import PlansModal from "./plans-modal";

// interface ModelSelectorProps {
//    selectedModel: string;
//    setSelectedModel: (model: string) => void;
// }

// export default function ModelSelector({ selectedModel, setSelectedModel }: ModelSelectorProps) {
//    const [isOpen, setIsOpen] = useState(false);
//    const [availableModels, setAvailableModels] = useState<any[]>([]);
//    const references = useRef<Array<HTMLElement | null>>([]);
//    const { user, profile } = useAuth();
//    const { showModal } = useModal();
//    useEffect(() => {
//       if (user && profile?.hasPurchasedCredits) {
//          setAvailableModels(models);
//       } else {
//          setAvailableModels(models.filter((model) => model.free));
//       }
//    }, [user, profile]);

//    const { refs, floatingStyles, context } = useFloating({
//       open: isOpen,
//       placement: "top-start",
//       onOpenChange: setIsOpen,
//       middleware: [offset(5), flip({ padding: 8 }), shift()],
//       whileElementsMounted: autoUpdate,
//    });

//    const click = useClick(context);
//    const dismiss = useDismiss(context);

//    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

//    const selectedModelData = models.find((model) => model.id === selectedModel) || models[0];

//    return (
//       <div>
//          <button
//             type="button"
//             className="bg-gray-1 dark:bg-gray-3 px-2 py-1 text-base flex items-center gap-2 rounded-md border border-gray-3 dark:border-gray-5 hover:bg-gray-2 dark:hover:bg-gray-4 transition-colors cursor-pointer text-gray-10 dark:text-gray-11"
//             ref={refs.setReference}
//             {...getReferenceProps()}
//          >
//             {selectedModelData.name}
//             <CaretDownIcon size={12} weight="bold" className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
//          </button>

//          {isOpen && (
//             <FloatingFocusManager context={context} modal={false}>
//                <div
//                   ref={refs.setFloating}
//                   style={floatingStyles}
//                   {...getFloatingProps()}
//                   className="bg-white dark:bg-gray-3 shadow-md border border-gray-4 dark:border-gray-5 rounded-md z-50 max-w-xl overflow-hidden"
//                >
//                   <motion.div
//                      initial="closed"
//                      animate="open"
//                      exit="closed"
//                      transition={{ duration: 0.15, staggerChildren: 0.04, staggerDirection: -1 }}
//                      className="divide-y divide-gray-4"
//                      variants={{
//                         open: { opacity: 1, y: 0 },
//                         closed: { opacity: 0, y: 10 },
//                      }}
//                   >
//                      {availableModels.map((model, index) => (
//                         <motion.button
//                            type="button"
//                            key={model.id}
//                            ref={(node) => {
//                               references.current[index] = node;
//                            }}
//                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-2 dark:hover:bg-gray-4 transition-colors flex flex-row items-center gap-4 justify-between ${
//                               selectedModel === model.id ? "bg-gray-2 dark:bg-gray-4 text-gray-12" : "text-gray-11"
//                            }`}
//                            onClick={() => {
//                               setSelectedModel(model.id);
//                               setIsOpen(false);
//                            }}
//                            variants={{
//                               open: { opacity: 1, y: 0 },
//                               closed: { opacity: 0, y: -10 },
//                            }}
//                         >
//                            <div className="flex flex-row gap-2">
//                               <p className="text-xs">{model.name}</p>
//                               {model.isNew && (
//                                  <div className="flex flex-row items-center gap-1 rounded-full">
//                                     <SparkleIcon size={12} weight="fill" className="text-sky-10" />
//                                     <p className="text-[11px] text-sky-11 dark:text-sky-5 font-medium">New</p>
//                                  </div>
//                               )}
//                            </div>

//                            <div className="grid grid-cols-2 gap-4 ml-auto">
//                               <div className="flex flex-col gap-px justify-center">
//                                  <p className="text-[10px] uppercase font-mono text-gray-10">Speed</p>

//                                  <div className="relative h-1 rounded-full bg-gray-5 w-20 overflow-hidden">
//                                     <div
//                                        className={`absolute inset-0 ${
//                                           (model.speed / 300) * 100 > 60
//                                              ? "bg-gradient-to-r from-grass-10 to-grass-8"
//                                              : "bg-gradient-to-r from-amber-10 to-amber-8"
//                                        } rounded-full`}
//                                        style={{ width: `${(model.speed / 320) * 100}%` }}
//                                     />
//                                  </div>
//                               </div>

//                               <div className="flex flex-col gap-px">
//                                  <p className="text-[10px] uppercase font-mono text-gray-10">Intelligence</p>
//                                  <div className="relative h-1 rounded-full bg-gray-5 w-20 overflow-hidden">
//                                     <div
//                                        className={`absolute inset-0 ${
//                                           (model.intelligence / 80) * 100 > 60
//                                              ? "bg-gradient-to-r from-grass-10 to-grass-8"
//                                              : "bg-gradient-to-r from-amber-10 to-amber-8"
//                                        } rounded-full`}
//                                        style={{ width: `${(model.intelligence / 90) * 100}%` }}
//                                     />
//                                  </div>
//                               </div>
//                            </div>
//                         </motion.button>
//                      ))}

//                      {!profile?.hasPurchasedCredits && (
//                         // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
//                         <div
//                            className="cursor-pointer px-3 py-3 text-gray-11 text-sm transition-colors hover:bg-gray-2 dark:hover:bg-gray-4"
//                            onClick={() => {
//                               showModal(<PlansModal />);
//                            }}
//                         >
//                            <p className="text-gray-12 font-medium text-xs">Looking for more models?</p>
//                            <p className="text-gray-11 text-xs">You need to purchase credits to unlock all models.</p>
//                         </div>
//                      )}
//                   </motion.div>
//                </div>
//             </FloatingFocusManager>
//          )}
//       </div>
//    );
// }
