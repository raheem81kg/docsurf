import { cn } from "@docsurf/ui/lib/utils";

interface DynamicImageProps
	extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "className"> {
	lightSrc: string;
	darkSrc: string;
	className?: string;
}

export function DynamicImage({
	lightSrc,
	darkSrc,
	alt,
	className,
	...props
}: DynamicImageProps) {
	return (
		<>
			<img
				src={lightSrc}
				alt={alt}
				className={cn("dark:hidden", className)}
				{...props}
			/>
			<img
				src={darkSrc}
				alt={alt}
				className={cn("hidden dark:block", className)}
				{...props}
			/>
		</>
	);
}
