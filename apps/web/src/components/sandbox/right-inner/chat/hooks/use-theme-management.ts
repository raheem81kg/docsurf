import { api } from "@docsurf/backend/convex/_generated/api";

import { useThemeStore } from "../lib/theme-store";
import { type FetchedTheme, THEME_URLS, type ThemePreset, fetchThemeFromUrl } from "../lib/theme-utils";
import { toggleThemeMode } from "../lib/toggle-theme-mode";
import { useConvexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/auth-hooks";

export function useThemeManagement() {
   const session = useSession();
   const { themeState, setThemeState } = useThemeStore();
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedThemeUrl, setSelectedThemeUrl] = useState<string | null>(null);

   // Fetch user settings to retrieve custom theme URLs
   const userSettings = useConvexQuery(api.settings.getUserSettings, session.user?.id ? {} : "skip");

   const addTheme = useMutation(api.settings.addUserTheme);
   const deleteTheme = useMutation(api.settings.deleteUserTheme);

   // Combine built-in and user-saved theme URLs (deduplicated)
   const allThemeUrls = useMemo(() => {
      const urlSet = new Set<string>(THEME_URLS);
      if (userSettings && !("error" in userSettings)) {
         (userSettings.customThemes ?? []).forEach((url: string) => urlSet.add(url));
      }
      return Array.from(urlSet);
   }, [userSettings]);

   const { data: fetchedThemes = [], isLoading: isLoadingThemes } = useQuery({
      queryKey: ["themes", allThemeUrls],
      queryFn: () => Promise.all(allThemeUrls.map(fetchThemeFromUrl)),
      enabled: allThemeUrls.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
   });

   const applyThemePreset = (preset: ThemePreset) => {
      setThemeState({
         currentMode: themeState.currentMode,
         cssVars: preset.cssVars,
      });
   };

   const handleThemeImported = (preset: ThemePreset, url: string) => {
      applyThemePreset(preset);
      setSelectedThemeUrl(url);

      if (!THEME_URLS.includes(url)) {
         try {
            addTheme({ url });
            toast.success("Theme imported successfully");
         } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add theme");
         }
      }
   };

   const handleThemeSelect = (theme: FetchedTheme) => {
      if ("error" in theme && theme.error) {
         return;
      }

      if ("preset" in theme) {
         applyThemePreset(theme.preset);
         setSelectedThemeUrl(theme.url);
      }
   };

   const handleThemeDelete = (url: string) => {
      if (THEME_URLS.includes(url)) return;
      deleteTheme({ url });
      toast.success("Theme deleted successfully");
   };

   const toggleMode = () => {
      toggleThemeMode();
   };

   const randomizeTheme = () => {
      const availableThemes = fetchedThemes.filter((theme) => !("error" in theme && theme.error));
      if (availableThemes.length > 0) {
         const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
         handleThemeSelect(randomTheme);
      }
   };

   const filteredThemes = fetchedThemes.filter((theme) => theme.name.toLowerCase().includes(searchQuery.toLowerCase()));

   const customThemes = filteredThemes.filter((theme) => theme.type === "custom");
   const builtInThemes = filteredThemes.filter((theme) => theme.type === "built-in");

   return {
      // State
      themeState,
      searchQuery,
      setSearchQuery,
      selectedThemeUrl,
      setSelectedThemeUrl,
      isLoadingThemes,
      fetchedThemes,
      filteredThemes,
      customThemes,
      builtInThemes,

      // Actions
      handleThemeImported,
      handleThemeSelect,
      handleThemeDelete,
      toggleMode,
      randomizeTheme,
      applyThemePreset,

      // User session
      session,
   };
}
