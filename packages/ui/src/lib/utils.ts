import { type ClassValue, clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const CAN_USE_DOM: boolean =
	typeof window !== "undefined" &&
	typeof window.document !== "undefined" &&
	typeof window.document.createElement !== "undefined";

export const isMac =
	typeof window !== "undefined" &&
	(/macintosh|mac os x/i.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export type Icon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
