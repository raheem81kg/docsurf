import { cn } from "@docsurf/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

type BlurImageProps = {
   src: string;
   alt: string;
   className?: string;
   width: number;
   height: number;
};

export function BlurImage({ src, alt, className, ...props }: BlurImageProps) {
   const [isLoaded, setIsLoaded] = useState(false);
   const imgRef = useRef<HTMLImageElement>(null);
   // We need to use a state for the src, to handle fallback images
   const [currentSrc, setCurrentSrc] = useState(src);

   useEffect(() => {
      // When the src prop changes, reset the loaded state
      // and update the currentSrc
      setCurrentSrc(src);
      setIsLoaded(false);
   }, [src]);

   useEffect(() => {
      const img = imgRef.current;

      const handleLoad = () => {
         setIsLoaded(true);
         const target = imgRef.current;
         if (target && target.naturalWidth <= 16 && target.naturalHeight <= 16) {
            setCurrentSrc(`https://avatar.vercel.sh/${encodeURIComponent(alt)}`);
         }
      };

      const handleError = () => {
         setIsLoaded(true); // Remove blur even on error
         setCurrentSrc(`https://avatar.vercel.sh/${encodeURIComponent(alt)}`);
      };

      if (!img) {
         return;
      }

      // Check if the image is already complete (e.g., cached)
      if (img.complete && img.naturalHeight > 0) {
         handleLoad();
      } else {
         img.addEventListener("load", handleLoad);
         img.addEventListener("error", handleError);
      }

      // Cleanup function to remove event listeners
      return () => {
         img.removeEventListener("load", handleLoad);
         img.removeEventListener("error", handleError);
      };
   }, [src, alt]);

   return (
      <img
         {...props}
         ref={imgRef}
         src={currentSrc}
         alt={alt}
         className={cn("transition-filter duration-300", isLoaded ? "blur-0" : "blur-[2px]", className)}
      />
   );
}
