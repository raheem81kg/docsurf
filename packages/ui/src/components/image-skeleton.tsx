import { motion } from "motion/react";
import { type ComponentProps, useEffect, useState } from "react";

type DotData = {
   id: string;
   row: number;
   col: number;
   index: number;
   delay: number;
   duration: number;
   colorIndices: number[];
};

type ImageSkeletonProps = {
   rows?: number;
   cols?: number;
   dotSize?: number;
   gap?: number;
   imageUrl?: string;
   loadingDuration?: number;
   autoLoop?: boolean;
} & ComponentProps<"div">;

export const ImageSkeleton = ({
   rows = 20,
   cols = 30,
   dotSize = 4,
   gap = 6,
   imageUrl = "/placeholder.svg?height=400&width=600",
   loadingDuration = 3000,
   autoLoop = true,
   className = "",
   ...props
}: ImageSkeletonProps) => {
   const [showImage, setShowImage] = useState(false);
   const [isLoaded, setIsLoaded] = useState(false);
   const [animationKey, setAnimationKey] = useState(0);
   const [isShimmering, setIsShimmering] = useState(true);

   const themeColors = [
      "bg-primary/10",
      "bg-primary/20",
      "bg-primary/30",
      "bg-primary/40",
      "bg-primary/50",
      "bg-primary/60",
      "bg-primary/70",
      "bg-primary/80",
      "bg-primary/90",
      "bg-primary/100",
   ];

   const generateDotsData = (): DotData[] => {
      const dots: DotData[] = [];
      for (let row = 0; row < rows; row++) {
         for (let col = 0; col < cols; col++) {
            dots.push({
               id: `${row}-${col}`,
               row,
               col,
               index: row * cols + col,
               delay: Math.random() * 2,
               duration: Math.random() * 1.5 + 0.8,
               colorIndices: [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 3, Math.floor(Math.random() * 4) + 6],
            });
         }
      }
      return dots;
   };

   const [dotsData] = useState<DotData[]>(() => generateDotsData());

   const ShimmerDot = ({ dot, dotSize }: { dot: DotData; dotSize: number }) => {
      const [colorIndex, setColorIndex] = useState(0);

      useEffect(() => {
         if (!isShimmering) return;
         const interval = setInterval(() => {
            setColorIndex((prev) => (prev + 1) % dot.colorIndices.length);
         }, dot.duration * 1000);
         return () => clearInterval(interval);
      }, [isShimmering, dot.duration, dot.colorIndices.length]);

      return (
         <motion.div
            className={`${themeColors[dot.colorIndices[colorIndex]]} transition-colors duration-300 rounded-sm`}
            style={{
               width: dotSize > 0 ? dotSize : "100%",
               height: dotSize > 0 ? dotSize : "100%",
               gridColumn: dot.col + 1,
               gridRow: dot.row + 1,
            }}
            initial={{ opacity: 0.7 }}
            animate={isShimmering ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
            transition={
               isShimmering
                  ? {
                       duration: dot.duration,
                       delay: dot.delay,
                       repeat: Number.POSITIVE_INFINITY,
                       repeatDelay: Math.random() * 0.5,
                       ease: "easeInOut",
                    }
                  : undefined
            }
         />
      );
   };

   useEffect(() => {
      if (loadingDuration === 99999) {
         setIsShimmering(true);
         setShowImage(false);
         return;
      }

      const startCycle = async () => {
         setShowImage(false);
         setIsLoaded(false);
         setIsShimmering(true);
         await new Promise((resolve) => setTimeout(resolve, loadingDuration));
         setIsShimmering(false);
         setShowImage(true);
         setTimeout(() => {
            setIsLoaded(true);
            if (autoLoop) {
               setTimeout(() => {
                  setAnimationKey((prev) => prev + 1);
               }, 2000);
            }
         }, 1000);
      };
      startCycle();
   }, [animationKey, loadingDuration, autoLoop]);

   return (
      <div {...props} className={`relative w-full h-full bg-muted/10 rounded-lg border border-border/50 overflow-hidden ${className}`}>
         <div
            style={{
               display: "grid",
               gridTemplateColumns: `repeat(${cols}, 1fr)`,
               gridTemplateRows: `repeat(${rows}, 1fr)`,
               gap: `${gap}px`,
               width: "100%",
               height: "100%",
            }}
         >
            {dotsData.map((dot) => (
               <ShimmerDot key={`${dot.id}-${animationKey}`} dot={dot} dotSize={0} />
            ))}
         </div>
      </div>
   );
};
