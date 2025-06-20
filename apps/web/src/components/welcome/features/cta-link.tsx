"use client";

import { cn } from "@docsurf/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Icons } from "@/components/assets/icons";

export function CtaLink({
	text,
	className,
}: {
	text: string;
	className?: string;
}) {
	return (
		<Link
			to="/auth"
			className={cn(
				"flex hidden items-center space-x-2 font-medium text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 xl:flex",
				className,
			)}
		>
			<span>{text}</span>
			<Icons.ArrowOutward />
		</Link>
	);
}
