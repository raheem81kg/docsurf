import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@docsurf/ui/components/button";

export const StickToBottomButton = ({ isAtBottom, scrollToBottom }: { isAtBottom: boolean; scrollToBottom: () => void }) => {
   return (
      <AnimatePresence>
         {!isAtBottom && (
            <motion.div
               initial={{ opacity: 0, y: 20, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 20, scale: 0.9 }}
               transition={{ duration: 0.1, ease: "easeOut" }}
            >
               <Button
                  onClick={() => scrollToBottom()}
                  size="sm"
                  variant="outline"
                  className="rounded-full border bg-background/80 backdrop-blur-xl transition-all duration-200 hover:bg-background/90"
               >
                  <span className="inline-block">Scroll to bottom</span>
                  <ChevronDown className="mt-0.5 h-4 w-4" />
               </Button>
            </motion.div>
         )}
      </AnimatePresence>
   );
};
