import { Loader2 } from "lucide-react";
// Optionally import your logo
// import Logo from "@/assets/logo.svg";

/**
 * Loader - Fullscreen loading spinner for SPA shell and route transitions.
 * Used as the defaultPendingComponent in TanStack Router.
 */
export default function Loader() {
   return (
      <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-gray-900 dark:from-gray-950 dark:to-gray-900">
         {/* Optionally add your logo here */}
         {/* <img src={Logo} alt="Docsurf Logo" className="mb-6 w-20 h-20" /> */}
         <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
         <span className="font-semibold text-gray-700 text-lg dark:text-gray-300">Loading Docsurf...</span>
      </div>
   );
}
