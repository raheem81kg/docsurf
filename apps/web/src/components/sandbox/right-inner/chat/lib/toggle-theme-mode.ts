import { useThemeStore } from "./theme-store"

export const toggleThemeMode = () => {
    const themeState = useThemeStore.getState().themeState
    const newMode = themeState.currentMode === "light" ? "dark" : "light"

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    console.log("prefersReducedMotion", prefersReducedMotion)

    if (!document.startViewTransition || prefersReducedMotion) {
        useThemeStore.getState().setThemeState({
            ...themeState,
            currentMode: newMode
        })
        return
    }

    document.startViewTransition(() => {
        useThemeStore.getState().setThemeState({
            ...themeState,
            currentMode: newMode
        })
    })
}
