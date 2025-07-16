/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@docsurf/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@docsurf/ui/components/badge";
import { Button } from "@docsurf/ui/components/button";
import { CheckoutLink } from "@convex-dev/polar/react";
import { Check, Gem } from "lucide-react";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import type React from "react";
import { PLANS } from "@docsurf/utils/constants/pricing";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Icons } from "../assets/icons";
import { Analytics } from "../providers/posthog";

interface PricingDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   children: React.ReactNode;
}

export function PricingDialog({ open, onOpenChange, children }: PricingDialogProps) {
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const { data: products } = useQuery(convexQuery(api.polar.listAllProducts, {}));
   const generateCustomerPortalUrl = api.polar.generateCustomerPortalUrl;
   const isPremium = user?.subscription?.isPremium;
   const proPlan = PLANS.find((plan) => plan.name === "Pro");
   const proPrice = proPlan?.price.monthly;
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogTrigger asChild>{children}</DialogTrigger>
         <DialogContent
            showCloseButton={false}
            className="flex w-96 items-center justify-center rounded-2xl border-none p-1"
            showOverlay
         >
            <VisuallyHidden>
               <DialogTitle className="text-center text-2xl">Pricing</DialogTitle>
               <DialogDescription>Pricing Dialog</DialogDescription>
            </VisuallyHidden>
            <div className="relative inline-flex h-[470px] max-h-[95vh] w-96 flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-400 bg-zinc-900/50 p-5 outline outline-2 outline-offset-[4px] outline-gray-400 dark:border-[#2D2D2D] dark:outline-[#2D2D2D]">
               <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
                  <img
                     src="/pricing-gradient.png"
                     alt="pricing-gradient"
                     className="absolute -right-0 -top-52 h-auto w-full"
                     height={535}
                     width={535}
                  />
               </div>
               {/* Pixel effect overlay */}
               <div className="relative right-5 top-[-70px] h-56 w-[720px]">
                  <div className="absolute left-[-157px] top-[-68.43px] h-36 w-[1034px] rounded-full bg-white/10 mix-blend-overlay blur-[100px]" />
                  <img
                     className="absolute left-0 top-0 h-56 w-[719.25px] mix-blend-screen"
                     src="/small-pixel.png"
                     height={56}
                     width={719}
                     alt="small-pixel"
                  />
               </div>
               <div className="relative w-full flex flex-col items-start justify-start gap-4">
                  <div className="flex w-full items-center justify-between mt-2">
                     <div className="inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-[#B183FF] p-2">
                        <div className="relative h-6 w-6">
                           <img height={24} width={24} src="/zap.svg" alt="hi" />
                        </div>
                     </div>
                     <div className="flex items-center gap-2 ">
                        <Badge className="border border-[#656565] bg-[#3F3F3F] text-white">Limited Offer</Badge>
                     </div>
                  </div>
                  <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                     <div className="inline-flex items-end justify-start gap-1 self-stretch">
                        <span className="text-xl font-medium line-through text-[#A586FF]  mr-1">
                           ${(proPlan?.price.monthly || 0) + 2}
                        </span>
                        <div className="justify-center text-4xl font-semibold leading-10 text-white">${proPrice}</div>
                        <div className="flex items-center justify-center gap-2.5 pb-0.5">
                           <div className="justify-center text-sm font-medium leading-tight text-white/40">/ MONTH</div>
                        </div>
                     </div>
                     <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                        <div className="justify-center self-stretch text-sm font-normal leading-normal text-white opacity-70 lg:text-base">
                           Gain access to premium models, unlimited chats, and more.
                        </div>
                     </div>
                  </div>
               </div>
               <div className="h-0 self-stretch outline outline-1 outline-offset-[-0.50px] outline-white/10 my-4" />
               <div className="flex flex-col items-start justify-start gap-2.5 self-stretch">
                  <div className="inline-flex items-center justify-start gap-2.5">
                     <div className="flex h-5 w-5 items-center justify-center gap-3 rounded-[125px] bg-[#1F1F1F] p-[5px] dark:bg-white/10">
                        <Gem className="!size-4.5 text-primary !text-[#A586FF]" />
                     </div>
                     <div className="justify-center font-normal leading-normal text-white lg:text-base">Unlimited chats per day</div>
                  </div>
                  <div className="inline-flex items-center justify-start gap-2.5 ">
                     <div className="flex h-5 w-5 items-center justify-center gap-3 rounded-[125px] bg-[#1F1F1F] p-[5px] dark:bg-white/10">
                        <Icons.PurpleThickCheck className="!size-4 text-primary " />
                     </div>
                     <div className="justify-center font-normal leading-normal text-white lg:text-base">Premium models</div>
                  </div>
                  <div className="inline-flex items-center justify-start gap-2.5">
                     <div className="flex h-5 w-5 items-center justify-center gap-3 rounded-[125px] bg-[#1F1F1F] p-[5px] dark:bg-white/10">
                        <Icons.PurpleThickCheck className="!size-4 text-primary" />
                     </div>
                     <div className="justify-center font-normal leading-normal text-white lg:text-base">Image Generation</div>
                  </div>
                  <div className="inline-flex items-center justify-start gap-2.5">
                     <div className="flex h-5 w-5 items-center justify-center gap-3 rounded-[125px] bg-[#1F1F1F] p-[5px] dark:bg-white/10">
                        <Icons.PurpleThickCheck className="!size-4 text-primary" />
                     </div>
                     <div className="justify-center font-normal leading-normal text-white lg:text-base">Web Search Tool</div>
                  </div>
                  <div className="inline-flex items-center justify-start gap-2.5">
                     <div className="flex h-5 w-5 items-center justify-center gap-3 rounded-[125px] bg-[#1F1F1F] p-[5px] dark:bg-white/10">
                        <Icons.PurpleThickCheck className="!size-4 text-primary" />
                     </div>
                     <div className="justify-center font-normal leading-normal text-white lg:text-base">Unlimited file uploads</div>
                  </div>
               </div>
               <div className="z-50 mt-12 w-full">
                  {!user ? (
                     <Button className="h-12 w-full" variant="outline" disabled>
                        Please sign in to upgrade
                     </Button>
                  ) : isPremium ? (
                     <Button
                        className="h-12 w-full"
                        variant="outline"
                        onClick={async () => {
                           // @ts-expect-error: Convex action import
                           const { url } = await generateCustomerPortalUrl();
                           window.location.href = url;
                        }}
                     >
                        Manage Subscription
                     </Button>
                  ) : (
                     products && (
                        // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
                        <span
                           onClick={() => {
                              Analytics.track("checkout_clicked");
                           }}
                        >
                           <Button
                              variant="outline"
                              asChild
                              className="h-12 w-full cursor-pointer !text-base !text-center !font-semibold !leading-none"
                           >
                              <CheckoutLink
                                 polarApi={{ generateCheckoutLink: api.polar.generateCheckoutLink }}
                                 productIds={products.map((product) => product.id)}
                                 embed={false}
                                 className="w-full"
                              >
                                 Upgrade to Pro
                              </CheckoutLink>
                           </Button>
                        </span>
                     )
                  )}
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
