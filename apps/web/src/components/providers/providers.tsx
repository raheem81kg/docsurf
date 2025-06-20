"use client";

import { TooltipProvider } from "@docsurf/ui/components/tooltip";
import {
	ThemeProvider as NextThemesProvider,
	type ThemeProviderProps,
} from "next-themes";
import { CookieProvider } from "./cookie-provider";

interface ProvidersProps extends ThemeProviderProps {}

export function Providers({ children, ...props }: ProvidersProps) {
	return (
		<NextThemesProvider {...props}>
			<CookieProvider>
				{import.meta.env.NODE_ENV === "development" ? (
					<TooltipProvider delayDuration={300}>{children}</TooltipProvider>
				) : (
					<TooltipProvider delayDuration={300}>{children}</TooltipProvider>
				)}
			</CookieProvider>
		</NextThemesProvider>
	);
}
