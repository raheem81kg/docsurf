/**
 * Subscription Settings Page
 * Allows users to view and manage their subscription (Free/Pro) using Polar payments.
 */
import { Button } from "@docsurf/ui/components/button";
import { Badge } from "@docsurf/ui/components/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@docsurf/ui/components/tooltip";
import { cn } from "@docsurf/ui/lib/utils";
import { api } from "@docsurf/backend/convex/_generated/api";
import { CreditCard, Check, Gem } from "lucide-react";
import { FREE_CHAT_USAGE_LIMIT, PRO_CHAT_USAGE_LIMIT } from "@/utils/constants";
import { SettingsLayout } from "@/components/sandbox/right-inner/chat/settings/settings-layout";
import { CheckoutLink } from "@convex-dev/polar/react";
import { createFileRoute } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Analytics } from "@/components/providers/posthog";

const productsQuery = convexQuery(api.polar.listAllProducts, {});

export const Route = createFileRoute("/settings/subscription")({
   component: SubscriptionSettingsPage,

   loader: async ({ context }) => {
      await context.queryClient.ensureQueryData(productsQuery);
   },

   head: () => ({
      meta: [
         {
            title: "Subscription | DocSurf",
         },
      ],
   }),
});

function FormSection(props: { className?: string; title: string; description: string; children: React.ReactNode }) {
   return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-8", props.className)}>
         <div className="flex flex-col gap-2">
            <div className="font-bold">{props.title}</div>
            <div className="text-muted-foreground">{props.description}</div>
         </div>
         <div className="col-span-2 flex flex-col gap-8">{props.children}</div>
      </div>
   );
}

function SubscriptionSettingsPage() {
   const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));

   const { data: products } = useSuspenseQuery(productsQuery);

   const generateCustomerPortalUrl = useAction(api.polar.generateCustomerPortalUrl);

   return (
      <SettingsLayout title="Subscription" description="Manage your subscription.">
         <FormSection title="Subscription" description="Manage your subscription.">
            <div className="space-y-4 pointer-events-auto">
               {/* Free Plan */}
               <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium">Free</h3>
                  <div className="flex gap-2 items-center">
                     <p className="text-sm font-medium">$0</p>
                     <p className="text-sm text-muted-foreground">/month</p>
                  </div>
                  <p className="text-sm text-muted-foreground">The essential features of DocSurf.</p>
                  <div className="flex flex-col gap-2">
                     <div className="flex flex-col gap-1">
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Tooltip>
                              <TooltipTrigger>
                                 <Gem className="!size-4 text-primary" />
                              </TooltipTrigger>
                              <TooltipContent>Used for image generation, research, and chatting</TooltipContent>
                           </Tooltip>{" "}
                           {FREE_CHAT_USAGE_LIMIT} chats monthly
                        </p>
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Check className="!size-4 text-primary" /> Image Generation
                        </p>
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Check className="!size-4 text-primary" /> Search Tool
                        </p>
                     </div>
                  </div>
               </div>
               {/* Pro Plan */}
               <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-lg border-primary/50 border">
                  <div className="flex gap-2 items-center justify-between">
                     <h3 className="text-sm font-medium">Pro</h3>
                     <Badge variant="secondary">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Gain access to premium models, research tool, and more.</p>
                  <div className="flex gap-2 items-center">
                     <span className="text-sm font-medium line-through text-muted-foreground mr-1">$12</span>
                     <p className="text-sm font-medium">$10</p>
                     <p className="text-sm text-muted-foreground">/month</p>
                  </div>
                  <div className="flex flex-col gap-2">
                     <div className="flex flex-col gap-1">
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Tooltip>
                              <TooltipTrigger>
                                 <Gem className="!size-4 text-primary" />
                              </TooltipTrigger>
                              <TooltipContent>Used for image generation, research, and chatting.</TooltipContent>
                           </Tooltip>{" "}
                           {PRO_CHAT_USAGE_LIMIT} chats monthly
                        </p>
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Check className="!size-4 text-primary" /> Premium models
                        </p>
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Check className="!size-4 text-primary" /> Image Generation
                        </p>
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Check className="!size-4 text-primary" /> Search Tool
                        </p>
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                           <Check className="!size-4 text-primary" /> Research Tool
                        </p>
                     </div>
                  </div>
                  {user?.subscription?.isFree && products && (
                     <div>
                        <Button variant="outline" asChild className="cursor-pointer ">
                           <CheckoutLink
                              polarApi={{ generateCheckoutLink: api.polar.generateCheckoutLink }}
                              productIds={products.map((product: any) => product.id)}
                              embed={false}
                              className=""
                           >
                              Upgrade to Pro
                           </CheckoutLink>
                        </Button>
                     </div>
                  )}
                  {user?.subscription?.isPremium && (
                     <div>
                        <Button
                           className="cursor-pointer"
                           variant="outline"
                           onClick={() =>
                              generateCustomerPortalUrl().then(({ url }) => {
                                 Analytics.track("subscription_management_accessed", {
                                    userId: user?._id,
                                 });
                                 window.location.href = url;
                              })
                           }
                        >
                           Manage Subscription
                        </Button>
                     </div>
                  )}
               </div>
            </div>
         </FormSection>
      </SettingsLayout>
   );
}
