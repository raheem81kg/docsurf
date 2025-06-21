import { Button } from "@docsurf/ui/components/button";
import { cn } from "@docsurf/ui/lib/utils";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

interface ManageSubscriptionButtonProps extends React.ComponentProps<typeof Button> {
   text?: string;
   variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
   className?: string;
}

export default function ManageSubscriptionButton({
   text = "Manage Subscription",
   variant = "secondary",
   className,
   ...props
}: ManageSubscriptionButtonProps) {
   const [clicked, setClicked] = useState(false);
   const router = useRouter();

   return (
      <Button
         {...props}
         variant={variant}
         className={cn(className, "h-9")}
         onClick={() => {
            setClicked(true);
            router.navigate({ to: "/doc" });
         }}
         disabled={clicked}
      >
         {text}
      </Button>
   );
}
