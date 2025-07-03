import { Activity, Zap } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type CSSProperties, forwardRef, useMemo, useState } from "react";
import { cn, type Icon } from "@docsurf/ui/lib/utils";
import { AnimatedSizeContainer } from "@docsurf/ui/components/_c/animated-size-container";
// import { buttonVariants } from "@docsurf/ui/components/button";
// import ManageSubscriptionButton from "./manage-subscription-button";
import { getCurrentPlan, getNextPlan, PLANS } from "@docsurf/utils/constants/pricing";
import { api } from "@docsurf/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";

export const INFINITY_NUMBER = 1000000000;

/**
 * Format numbers for display (e.g., 1.2K, 1M)
 */
export function nFormatter(num?: number, opts: { digits?: number; full?: boolean } = { digits: 1 }) {
   if (!num) return "0";
   if (opts.full) {
      return Intl.NumberFormat("en-US").format(num);
   }
   const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
   if (num < 1) {
      return num.toFixed(opts.digits).replace(rx, "$1");
   }
   const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "K" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "G" },
      { value: 1e12, symbol: "T" },
      { value: 1e15, symbol: "P" },
      { value: 1e18, symbol: "E" },
   ];
   var item = lookup
      .slice()
      .reverse()
      .find((item) => num >= item.value);
   return item ? (num / item.value).toFixed(opts.digits).replace(rx, "$1") + item.symbol : "0";
}

/**
 * Usage Sidebar Entry Point
 */
export function Usage() {
   return <UsageInner />;
}

/**
 * Usage Sidebar Inner Component
 * Fetches and displays usage, plan, and subscription info.
 */
function UsageInner() {
   // Fetch current user (includes subscription info)
   const { data: user, isLoading: userLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   // Fetch usage stats for the last 7 days
   const { data: usageStats, isLoading: usageLoading } = useQuery(convexQuery(api.analytics.getMyUsageStats, { timeframe: "7d" }));

   // Determine plan and limits
   // const planName = user?.subscription?.isPremium ? "Pro" : "Free";
   const planName = "Free"; // Default to Free plan for now
   const plan = getCurrentPlan(planName);
   const nextPlan = getNextPlan(planName);
   const isFreePlan = planName === "Free";
   const isEnterprisePlan = false; // Extend if you add enterprise
   const paymentFailedAt = undefined; // Extend if you add payment failure logic

   // Usage values
   const requestsUsed = usageStats?.totalRequests ?? 0;
   const requestsLimit = plan.limits.requests7d ?? 999999999;
   const tokensUsed = usageStats?.totalTokens ?? 0;
   const tokensLimit = plan.limits.tokens7d ?? 999999999;
   // TODO: Use usage stats in UsageRows when we add limits

   // Next plan limits
   const nextRequestsLimit = nextPlan?.limits.requests7d;
   const nextTokensLimit = nextPlan?.limits.tokens7d;

   // Billing reset date from subscription
   // const billingEnd = user?.subscription?.currentPeriodEnd
   //    ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString("en-us", {
   //         month: "short",
   //         day: "numeric",
   //         year: "numeric",
   //      })
   //    : undefined;
   const billingEnd = undefined; // Commented out subscription billing

   // Warn if >= 90% of any limit
   const warnings = useMemo(
      () => [requestsLimit > 0 && requestsUsed / requestsLimit >= 0.9, tokensLimit > 0 && tokensUsed / tokensLimit >= 0.9],
      [requestsUsed, requestsLimit, tokensUsed, tokensLimit]
   );
   const warning = warnings.some(Boolean);

   const [hovered, setHovered] = useState(false);

   return (
      <AnimatedSizeContainer height>
         <div className="px-2 py-3 border-t">
            <Link
               className="group flex items-center gap-0.5 text-xs font-normal text-muted-foreground opacity-50 transition-colors hover:text-text-default"
               to="/settings/usage"
            >
               Chat Usage
               <ChevronRight className="size-3 text-neutral-400 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-500" />
            </Link>

            <div className="mt-3 flex flex-col gap-4">
               <UsageRow
                  icon={Activity}
                  label="Requests"
                  usage={requestsUsed}
                  limit={requestsLimit}
                  showNextPlan={hovered}
                  nextPlanLimit={nextRequestsLimit}
                  warning={warnings[0] ?? false}
                  isLoading={userLoading || usageLoading}
               />
               <UsageRow
                  icon={Zap}
                  label="Tokens"
                  usage={tokensUsed}
                  limit={tokensLimit}
                  showNextPlan={hovered}
                  nextPlanLimit={nextTokensLimit}
                  warning={warnings[1] ?? false}
                  isLoading={userLoading || usageLoading}
               />
            </div>

            <div className="mt-3">
               <p className={cn("text-xs text-muted-foreground opacity-50", paymentFailedAt && "text-red-600")}>
                  {paymentFailedAt
                     ? "Your last payment failed. Please update your payment method to continue using DocSurf."
                     : billingEnd
                     ? `Usage will reset ${billingEnd}`
                     : ""}
               </p>
            </div>

            {/* Commented out subscription/payment related buttons */}
            {/* {paymentFailedAt ? (
               <ManageSubscriptionButton
                  text="Update Payment Method"
                  variant="ghost"
                  className="mt-4 w-full"
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
               />
            ) : (warning || isFreePlan) && !isEnterprisePlan ? (
               <Link
                  to="/settings/subscription"
                  className={cn(buttonVariants(), "mt-4 flex h-9 items-center justify-center border px-4 text-sm")}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
               >
                  {isFreePlan ? "Get DocSurf Pro" : "Upgrade plan"}
               </Link>
            ) : null} */}
         </div>
      </AnimatedSizeContainer>
   );
}

/**
 * Usage Row Component
 * Shows a single usage metric (requests/tokens)
 */
type UsageRowProps = {
   icon: Icon;
   label: string;
   usage?: number;
   limit?: number;
   showNextPlan: boolean;
   nextPlanLimit?: number;
   warning: boolean;
   isLoading: boolean;
};

const UsageRow = forwardRef<HTMLDivElement, UsageRowProps>(
   ({ icon: Icon, label, usage = 0, limit = 0, showNextPlan, nextPlanLimit, warning, isLoading }: UsageRowProps, ref) => {
      const unlimited = limit !== undefined && limit >= INFINITY_NUMBER;
      return (
         <div ref={ref}>
            <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-2">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
               </div>
               {!isLoading ? (
                  <div className="flex items-center">
                     <span className="text-xs font-medium text-muted-foreground">
                        <NumberFlow value={usage ?? 0} /> of{" "}
                        <motion.span
                           className={cn(
                              "relative transition-colors duration-150",
                              showNextPlan && nextPlanLimit ? "text-muted-foreground" : "text-muted-foreground"
                           )}
                        >
                           {formatNumber(limit ?? 0)}
                           {showNextPlan && nextPlanLimit && (
                              <motion.span
                                 className="absolute bottom-[45%] left-0 h-[1px] bg-neutral-400"
                                 initial={{ width: "0%" }}
                                 animate={{ width: "100%" }}
                                 transition={{ duration: 0.25, ease: "easeInOut" }}
                              />
                           )}
                        </motion.span>
                     </span>
                     <AnimatePresence>
                        {showNextPlan && nextPlanLimit && (
                           <motion.div
                              className="flex items-center"
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: "auto", opacity: 1 }}
                              exit={{ width: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                           >
                              <motion.span className="ml-1 whitespace-nowrap text-xs font-medium text-blue-500">
                                 {formatNumber(nextPlanLimit)}
                              </motion.span>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               ) : (
                  <div className="h-[18px] w-16 animate-pulse rounded-sm bg-neutral-500/10 dark:bg-border/40" />
               )}
            </div>
            {!unlimited && (
               <div className="mt-1.5">
                  <div
                     className={cn(
                        "h-0.5 w-full overflow-hidden rounded-full bg-neutral-900/10 transition-colors dark:bg-border/60",
                        isLoading && "bg-neutral-900/5"
                     )}
                  >
                     {!isLoading && (
                        <div className="animate-slide-right-fade size-full" style={{ "--offset": "-100%" } as CSSProperties}>
                           <div
                              className={cn(
                                 "size-full rounded-full bg-gradient-to-r from-transparent to-blue-500",
                                 warning && "to-rose-500"
                              )}
                              style={{
                                 transform: `translateX(-${
                                    100 -
                                    Math.max(
                                       Math.floor(((usage ?? 0) / Math.max(0, usage ?? 0, limit ?? 0)) * 100),
                                       usage === 0 ? 0 : 1
                                    )
                                 }%)`,
                                 transition: "transform 0.25s ease-in-out",
                              }}
                           />
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      );
   }
);

/**
 * Format a number for display, using nFormatter for large values or full for small values.
 */
const formatNumber = (value: number) =>
   value >= INFINITY_NUMBER
      ? "∞"
      : nFormatter(value, {
           full: value !== undefined && value < 999,
           digits: 1,
        });
