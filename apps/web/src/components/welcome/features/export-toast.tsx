import { Progress } from "@docsurf/ui/components/progress";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

export function ExportToast() {
   const [progress, setProgress] = useState(0);
   const { ref, inView } = useInView({
      triggerOnce: true,
   });

   useEffect(() => {
      if (!inView) return;

      const timer = setInterval(() => {
         setProgress((oldProgress) => {
            if (oldProgress === 100) {
               clearInterval(timer);
               return 100;
            }
            return Math.min(oldProgress + 25, 100);
         });
      }, 300);

      return () => {
         clearInterval(timer);
      };
   }, [inView]);

   return (
      <div ref={ref} className="flex w-full flex-col space-y-3 rounded-sm border border-border darK:bg-[#121212] p-4">
         <div className="flex items-center space-x-2">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-medium text-sm">Exporting {progress}%</span>
         </div>

         <Progress value={progress} className="h-0.5 w-full" />

         <span className="text-[#878787] text-xs">Please do not close browser until completed</span>
      </div>
   );
}
