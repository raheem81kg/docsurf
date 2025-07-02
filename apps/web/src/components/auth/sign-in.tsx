import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@docsurf/ui/components/accordion";
import Balancer from "react-wrap-balancer";
import { GoogleSignIn } from "./google-sign-in";
import { OTPSignIn } from "./otp-sign-in";
import { COOKIES } from "@/utils/constants";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCookies } from "react-cookie";

type PreferredSignInProvider = "google" | "otp";

export const SignIn = ({ inviteCode }: { inviteCode?: string }) => {
   const navigate = useNavigate({
      from: "/",
   });
   const [cookies, setCookie] = useCookies();
   const [mounted, setMounted] = useState(false);
   const [authLoading, setAuthLoading] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) return null;

   const preferredSignInProvider = cookies[COOKIES.PreferredSignInProvider] as PreferredSignInProvider | "google";
   let preferredSignInOption: React.ReactNode;

   const handleGoogleSignIn = async () => {
      await authClient.signIn.social(
         {
            provider: "google",
            callbackURL: "/doc",
            errorCallbackURL: "/auth",
         },
         {
            onRequest: () => {
               setAuthLoading(true);
            },
            onSuccess: async () => {
               setAuthLoading(false);
               setCookie(COOKIES.PreferredSignInProvider, "google");
            },
            onError: (ctx) => {
               setAuthLoading(false);
               alert(ctx.error.message);
            },
         }
      );
   };

   // Determine which sign-in option to show based on preference
   switch (preferredSignInProvider) {
      case "google":
         preferredSignInOption = (
            <div className="flex flex-col space-y-2">
               <GoogleSignIn onClick={handleGoogleSignIn} disabled={authLoading} />
            </div>
         );
         break;
      case "otp":
      default:
         preferredSignInOption = (
            <div className="flex flex-col space-y-2">
               <OTPSignIn />
            </div>
         );
   }

   // Show the alternative sign-in option in the accordion
   const moreSignInOptions =
      preferredSignInProvider === "google" ? (
         <div className="flex flex-col space-y-2">
            <OTPSignIn />
         </div>
      ) : (
         <div className="flex flex-col space-y-2">
            <GoogleSignIn onClick={handleGoogleSignIn} disabled={authLoading} />
         </div>
      );

   return (
      <div className="flex w-full flex-col relative">
         <Balancer>
            <h1 className="font-medium text-3xl pb-1">Get Started with Docsurf</h1>
            <h2 className="font-medium text-xl pb-1">Sign in to your account</h2>
         </Balancer>

         <div className="pointer-events-auto mt-6 flex flex-col mb-6">
            {preferredSignInOption}

            <Accordion type="single" collapsible className="border-t-[1px] pt-2 mt-6">
               {moreSignInOptions && (
                  <AccordionItem value="item-1" className="border-0">
                     <AccordionTrigger className="justify-center space-x-2 flex text-sm">
                        <span>More options</span>
                     </AccordionTrigger>
                     <AccordionContent className="mt-4">
                        <div className="flex flex-col space-y-4">{moreSignInOptions}</div>
                     </AccordionContent>
                  </AccordionItem>
               )}
            </Accordion>
         </div>

         <p className="text-xs text-muted-foreground">
            By clicking continue, you acknowledge that you have read and agree to the{" "}
            <Link to="/terms" className="underline">
               Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link to="/policy" className="underline">
               Privacy Policy
            </Link>
            .
         </p>
      </div>
   );
};
