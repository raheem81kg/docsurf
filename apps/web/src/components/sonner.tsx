"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useThemeStore } from "./sandbox/right-inner/chat/lib/theme-store";

const Toaster = ({ ...props }: ToasterProps) => {
   const { themeState } = useThemeStore();

   return (
      <Sonner
         theme={themeState.currentMode as ToasterProps["theme"]}
         className="toaster group"
         style={
            {
               "--normal-bg": "var(--popover)",
               "--normal-text": "var(--popover-foreground)",
               "--normal-border": "var(--border)",
            } as React.CSSProperties
         }
         {...props}
      />
   );
};

export { Toaster };
