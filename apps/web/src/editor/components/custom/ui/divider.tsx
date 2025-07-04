import { cn } from "@docsurf/ui/lib/utils";

type Props = {
   type?: "horizontal" | "vertical";
   className?: string;
};

export function Divider(props: Props) {
   const { type = "vertical", className } = props;

   return <div className={cn("shrink-0 bg-border", type === "vertical" ? "mx-0.5 w-px" : "my-0.5 h-px", className)} />;
}
