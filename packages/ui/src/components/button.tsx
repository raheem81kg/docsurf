import { cn } from "@docsurf/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const buttonVariants = cva(
	"inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-brand text-default shadow-xs hover:bg-brand/80",
				destructive:
					"text-text-error shadow-xs hover:bg-bg-error focus-visible:ring-bg-error/20 dark:focus-visible:ring-bg-error/40",
				outline:
					"border bg-transparent text-brand shadow-xs hover:text-brand/85",
				secondary:
					"bg-[unset] text-black shadow-xs [background:var(--button-secondary-gradient)] hover:opacity-80",
				ghost:
					"hover:bg-accent/70 hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline",
				"link-blue": "text-blue-800 underline underline-offset-2",
			},
			size: {
				default: "h-8 px-3 py-2 has-[>svg]:px-3",
				sm: "h-7 gap-1.5 rounded-sm px-3 has-[>svg]:px-2.5",
				md: "h-9 rounded-sm px-5 has-[>svg]:px-3.5",
				lg: "h-10 rounded-sm px-6 py-4 has-[>svg]:px-4",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
