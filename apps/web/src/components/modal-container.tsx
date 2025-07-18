"use client";

import { AnimatePresence, motion } from "motion/react";

import { useFloating, useDismiss, useRole, useInteractions, useId, FloatingFocusManager } from "@floating-ui/react";
import { useModal } from "./providers/modal-provider";
import { useThemeStore } from "./sandbox/right-inner/chat/lib/theme-store";

export function ModalContainer() {
   const { isOpen, modal, hideModal } = useModal();
   const { themeState } = useThemeStore();

   // Add floating UI hooks
   const { refs, context } = useFloating({
      open: isOpen,
      onOpenChange: (open) => {
         if (!open) hideModal();
      },
   });

   const dismiss = useDismiss(context, {
      outsidePressEvent: "mousedown",
   });
   const role = useRole(context);

   const { getFloatingProps } = useInteractions([dismiss, role]);

   // Generate IDs for accessibility
   const labelId = useId();
   const descriptionId = useId();

   return (
      <AnimatePresence>
         {isOpen && (
            <>
               {/* Background Overlay */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`fixed inset-0 w-screen backdrop-blur-xs h-screen bg-gray-1/50 z-50 ${
                     themeState.currentMode === "dark" ? "dark" : ""
                  }`}
               />
               {/* Modal Content */}
               <FloatingFocusManager context={context}>
                  <div
                     ref={refs.setFloating}
                     {...getFloatingProps({
                        "aria-labelledby": labelId,
                        "aria-describedby": descriptionId,
                     })}
                     className={`fixed inset-0 z-60 flex p-20 justify-center pointer-events-none ${
                        themeState.currentMode === "dark" ? "dark" : ""
                     }`}
                  >
                     <div className="pointer-events-auto">{modal}</div>
                  </div>
               </FloatingFocusManager>
            </>
         )}
      </AnimatePresence>
   );
}
