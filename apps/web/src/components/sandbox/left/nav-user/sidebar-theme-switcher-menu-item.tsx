"use client";

import { useTheme } from "next-themes";

import { MoonIcon } from "@/components/assets/animated/moon";
import { SunIcon } from "@/components/assets/animated/sun";
import { useEffect, useState } from "react";
import { DropdownMenuItem } from "@docsurf/ui/components/dropdown-menu";

export function SidebarThemeSwitchMenuItem() {
   const [isRendered, setIsRendered] = useState(false);
   const { theme, resolvedTheme, setTheme } = useTheme();

   // Prevents hydration error
   useEffect(() => setIsRendered(true), []);

   async function handleThemeToggle() {
      const newTheme = theme === "dark" ? "light" : "dark";
      const nextResolvedTheme = newTheme;
      function update() {
         setTheme(newTheme);
      }
      if (
         typeof window !== "undefined" &&
         document.startViewTransition &&
         (nextResolvedTheme === "dark" || nextResolvedTheme === "light") &&
         nextResolvedTheme !== resolvedTheme
      ) {
         document.documentElement.style.viewTransitionName = "theme-transition";
         await document.startViewTransition(update).finished;
         document.documentElement.style.viewTransitionName = "";
      } else {
         update();
      }
   }

   if (!isRendered) return null;

   return (
      <DropdownMenuItem onClick={handleThemeToggle} className="cursor-pointer group">
         <div className="flex items-center gap-2">
            {theme === "dark" ? (
               <MoonIcon className="size-4 text-text-default hover:text-text-emphasis" />
            ) : (
               <SunIcon className="size-4 text-text-default hover:text-text-emphasis" />
            )}
            <span className="text-[13px] text-text-default hover:text-text-emphasis">App Theme</span>
         </div>
      </DropdownMenuItem>
   );
}
