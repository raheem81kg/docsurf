import { cn } from "@docsurf/ui/lib/utils";

export function AppIntroLoadingScreen({ className }: { className?: string }) {
   return (
      <div className={cn("min-w-screen flex h-full min-h-screen w-full items-center justify-center", className)}>
         <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="font-neotrax text-4xl text-gray-800">loading your workspaces</h2>
            <div>
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-loader-circle size-4 animate-spin"
                  aria-hidden="true"
               >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
               </svg>
            </div>
         </div>
      </div>
   );
}
