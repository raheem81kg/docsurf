import { DashIcon } from "@radix-ui/react-icons";
import { cn } from "@docsurf/ui/lib/utils";
import { OTPInput, type SlotProps } from "input-otp";
import * as React from "react";

const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
   ({ className, ...props }, ref) => <OTPInput ref={ref} containerClassName={cn("flex items-center gap-2", className)} {...props} />
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
   ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center", className)} {...props} />
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<React.ElementRef<"div">, SlotProps & React.ComponentPropsWithoutRef<"div">>(
   ({ char, hasFakeCaret, isActive, className, placeholderChar = "•", ...props }, ref) => {
      return (
         <div
            ref={ref}
            className={cn(
               "relative flex h-16 w-16 items-center justify-center border-input border-y border-r text-2xl transition-all first:border-l",
               isActive && "z-10 ring-1 ring-ring",
               className
            )}
            {...props}
         >
            {char || placeholderChar}
            {hasFakeCaret && (
               <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
               </div>
            )}
         </div>
      );
   }
);
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(({ ...props }, ref) => (
   <div ref={ref} {...props}>
      <DashIcon />
   </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
