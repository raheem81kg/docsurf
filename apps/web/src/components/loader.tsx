import { Loader2 } from "lucide-react";
// Optionally import your logo
// import Logo from "@/assets/logo.svg";

/**
 * Loader - Fullscreen loading spinner for SPA shell and route transitions.
 * Used as the defaultPendingComponent in TanStack Router.
 */
export default function Loader() {
   return (
      <div className="flex min-h-screen items-center justify-center pt-8">
         <Loader2 className="animate-spin" />
      </div>
   );
}
