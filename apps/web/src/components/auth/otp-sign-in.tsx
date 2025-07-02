import { InputOTP, InputOTPGroup, InputOTPSlot } from "@docsurf/ui/components/_c/input-otp";
import { Button } from "@docsurf/ui/components/button";
import { Input } from "@docsurf/ui/components/input";
import { cn } from "@docsurf/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Icons } from "../assets/icons";
import { useCookies } from "react-cookie";
import { COOKIES } from "@/utils/constants";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";

type Props = {
   className?: string;
};

export function OTPSignIn({ className }: Props) {
   const [isSent, setSent] = useState(false);
   const [email, setEmail] = useState<string>();
   const [isVerifying, setIsVerifying] = useState(false);
   const navigate = useNavigate();
   const [_, setCookie] = useCookies();
   const form = useForm({
      defaultValues: {
         email: "",
      },
      onSubmit: async ({ value }) => {
         await authClient.emailOtp.sendVerificationOtp(
            {
               email: value.email,
               type: "sign-in",
            },
            {
               onSuccess: () => {
                  setEmail(value.email);
                  setSent(true);
                  showToast("Verification code sent to your email.", "success");
                  if (import.meta.env.DEV) {
                     console.log("DEBUG: setSent(true), setEmail", value.email);
                  }
               },
               onError: (err) => {
                  showToast(err.error.message, "error");
               },
            }
         );
      },
   });

   const onVerify = async (token: string, email: string) => {
      setIsVerifying(true);
      await authClient.signIn.emailOtp(
         {
            email,
            otp: token,
         },
         {
            onSuccess: async () => {
               setCookie(COOKIES.PreferredSignInProvider, "otp");
               await navigate({ to: "/doc" });
            },
            onError: (err) => {
               showToast("Invalid verification code. Please try again.", "error");
            },
            onSettled: () => {
               setIsVerifying(false);
            },
         }
      );
   };

   if (isSent) {
      return (
         <div className={cn("flex flex-col items-center space-y-4", className)}>
            <h1 className="font-medium text-2xl">Enter verification code</h1>

            <InputOTP
               maxLength={6}
               autoFocus
               onComplete={(token) => email && onVerify(token, email)}
               disabled={isVerifying}
               render={({ slots }) => (
                  <InputOTPGroup>
                     {slots.map((slot, index) => (
                        <InputOTPSlot key={index.toString()} {...slot} className="h-[62px] w-[62px]" />
                     ))}
                  </InputOTPGroup>
               )}
            />

            <div className="flex flex-col items-center">
               <span className="text-muted-foreground text-sm">Check your email for the verification code</span>
               <button onClick={() => setSent(false)} type="button" className="font-medium text-primary text-sm underline">
                  Try again
               </button>
            </div>
         </div>
      );
   }

   return (
      <form
         onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
         }}
      >
         <div className={cn("flex flex-col space-y-4", className)}>
            <form.Field name="email">
               {(field) => (
                  <Input
                     id={field.name}
                     name={field.name}
                     value={field.state.value}
                     onBlur={field.handleBlur}
                     onChange={(e) => field.handleChange(e.target.value)}
                     placeholder="Enter email address"
                     autoFocus
                     className="h-[40px]"
                     autoCapitalize="false"
                     autoCorrect="false"
                     spellCheck="false"
                  />
               )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
               {([canSubmit, isSubmitting]) => (
                  <Button
                     type="submit"
                     size="lg"
                     className="flex w-full space-x-2 rounded-none font-medium active:scale-[0.98]"
                     disabled={!canSubmit || isSubmitting}
                  >
                     {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                     <Icons.EmailIcon className="!size-5 invert dark:invert-0" />
                     <span>Sign in with email</span>
                  </Button>
               )}
            </form.Subscribe>
         </div>
      </form>
   );
}
