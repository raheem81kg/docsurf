export function ThemeScript() {
   // Inline critical dark theme CSS variables for first paint
   const criticalDarkVars = `
    :root, html.dark {
      --background: oklch(0.145 0 0);
      --foreground: oklch(0.985 0 0);
      --card: oklch(0.145 0 0);
      --card-foreground: oklch(0.985 0 0);
      --popover: oklch(0.145 0 0);
      --popover-foreground: oklch(0.985 0 0);
      --primary: oklch(0.985 0 0);
      --primary-foreground: oklch(0.205 0 0);
      --secondary: oklch(0.269 0 0);
      --secondary-foreground: oklch(0.985 0 0);
      --muted: oklch(0.2 0 0);
      --muted-foreground: oklch(0.708 0 0);
      --accent: oklch(0.269 0 0);
      --accent-foreground: oklch(0.985 0 0);
      --destructive: oklch(0.396 0.141 25.723);
      --destructive-foreground: oklch(0.637 0.237 25.331);
      --border: oklch(0.269 0 0);
      --input: oklch(0.269 0 0);
      --ring: oklch(0.556 0 0);
      --radius: 0.625rem;
      --sidebar: oklch(0.205 0 0);
      --sidebar-foreground: oklch(0.985 0 0);
      --sidebar-primary: oklch(0.488 0.243 264.376);
      --sidebar-primary-foreground: oklch(0.985 0 0);
      --sidebar-accent: oklch(0.269 0 0);
      --sidebar-accent-foreground: oklch(0.985 0 0);
      --sidebar-border: oklch(0.269 0 0);
      --sidebar-ring: oklch(0.439 0 0);
    }
  `;

   const scriptContent = `
    (function() {
      const storageKey = "theme-store";
      const root = document.documentElement;

      let themeState = null;
      try {
        const persistedStateJSON = localStorage.getItem(storageKey);
        if (persistedStateJSON) {
          themeState = JSON.parse(persistedStateJSON)?.state?.themeState;
        }
      } catch (e) {
        console.warn("Theme initialization: Failed to read/parse localStorage:", e);
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const mode = themeState?.currentMode ?? (prefersDark ? "dark" : "light");

      const activeStyles =
        mode === "dark"
          ? themeState?.cssVars?.dark
          : themeState?.cssVars?.light;

      if (!activeStyles) {
        return;
      }

      const stylesToApply = Object.keys(activeStyles);

      for (const styleName of stylesToApply) {
        const value = activeStyles[styleName];
        if (value !== undefined) {
          root.style.setProperty(\`--\${styleName}\`, value);
        }
      }
    })();
  `;

   return (
      <>
         <style
            // biome-ignore lint/security/noDangerouslySetInnerHtml: critical theme variables for first paint
            dangerouslySetInnerHTML={{ __html: criticalDarkVars }}
            suppressHydrationWarning
         />
         <script
            // biome-ignore lint/security/noDangerouslySetInnerHtml: this script needs to execute immediately
            dangerouslySetInnerHTML={{ __html: scriptContent }}
            suppressHydrationWarning
         />
      </>
   );
}
