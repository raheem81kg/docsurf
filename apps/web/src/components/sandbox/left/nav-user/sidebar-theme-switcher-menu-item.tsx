"use client";

import { useEffect, useState } from "react";
import { DropdownMenuItem } from "@docsurf/ui/components/dropdown-menu";
import { MoonIcon } from "@/components/assets/animated/moon";
import { SunIcon } from "@/components/assets/animated/sun";
import { useThemeStore } from "@/components/sandbox/right-inner/chat/lib/theme-store";
import { toggleThemeMode } from "@/components/sandbox/right-inner/chat/lib/toggle-theme-mode";

export function SidebarThemeSwitchMenuItem() {
   const [isRendered, setIsRendered] = useState(false);
   const { themeState } = useThemeStore();

   // Prevents hydration error
   useEffect(() => setIsRendered(true), []);

   function handleThemeToggle() {
      toggleThemeMode();
   }

   if (!isRendered) return null;

   return (
      <DropdownMenuItem onClick={handleThemeToggle} className="cursor-pointer group">
         <div className="flex items-center gap-2">
            {themeState.currentMode === "dark" ? (
               <MoonIcon className="size-4 text-text-default hover:text-text-emphasis" />
            ) : (
               <SunIcon className="size-4 text-text-default hover:text-text-emphasis" />
            )}
            <span className="text-[13px] text-text-default hover:text-text-emphasis">App Theme</span>
         </div>
      </DropdownMenuItem>
   );
}
