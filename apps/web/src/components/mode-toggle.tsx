import { Loader2 } from "lucide-react";

export function ModeToggle({
   isServer,
   onSwitch,
   isPending,
}: {
   isServer: boolean;
   onSwitch?: (isServer: boolean) => void;
   isPending?: boolean;
}) {
   return (
      <div className="mb-6 flex w-full justify-center">
         <div className="inline-flex max-w-2xl rounded-full bg-neutral-800/80 p-1 shadow" role="tablist" aria-label="Dashboard mode">
            <button
               type="button"
               role="tab"
               aria-selected={!isServer}
               onClick={() => onSwitch?.(false)}
               disabled={!isServer || isPending}
               className={`rounded-full px-6 py-2 font-semibold outline-none transition-all ${
                  !isServer
                     ? "bg-white font-bold text-black shadow"
                     : "cursor-pointer bg-transparent text-neutral-400 hover:bg-neutral-700 hover:text-white"
               } ${isPending && !isServer ? "opacity-60" : ""} `}
            >
               {!isServer && isPending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Client Only"}
            </button>
            <button
               type="button"
               role="tab"
               aria-selected={isServer}
               onClick={() => onSwitch?.(true)}
               disabled={isServer || isPending}
               className={`rounded-full px-6 py-2 font-semibold outline-none transition-all ${
                  isServer
                     ? "bg-white font-bold text-black shadow"
                     : "cursor-pointer bg-transparent text-neutral-400 hover:bg-neutral-700 hover:text-white"
               } ${isPending && isServer ? "opacity-60" : ""} `}
            >
               {isServer && isPending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Server"}
            </button>
         </div>
      </div>
   );
}
