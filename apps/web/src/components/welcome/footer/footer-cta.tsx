import { Button } from "@docsurf/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function FooterCTA() {
   return (
      <div className="mt-24 mb-32 flex flex-col items-center border border-border bg-[#F2F1EF] px-10 py-14 text-center md:container md:mx-auto md:px-24 md:py-20 dark:bg-[#121212]">
         <span className="font-medium text-4xl  md:text-6xl text-text-default md:text-8xl dark:text-white">
            Elevate your writing with AI intelligence.
         </span>
         <p className="mt-6 text-[#878787]">
            Experience seamless document creation with smart suggestions, intelligent formatting, <br /> and advanced AI-powered
            assistance.
         </p>

         <div className="mt-10 md:mb-8">
            <div className="flex items-center space-x-4">
               {/* <Link to="/auth" target="_blank" rel="noopener noreferrer" title="Start Writing">
                  <Button variant="outline" className="hidden h-12 border border-brand px-6 text-primary md:block">
                     Start Writing
                  </Button>
               </Link> */}

               <Link to="/auth" title="Start Writing For Free">
                  <Button className="flex h-12 items-center gap-2 px-5">
                     <span className="text-default">Start Writing For Free</span>
                     <ArrowRight className="size-5 text-default" />
                  </Button>
               </Link>
            </div>
         </div>
      </div>
   );
}
