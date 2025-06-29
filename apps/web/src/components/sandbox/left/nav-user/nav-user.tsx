import { ChevronDown, LogOut, Settings, Sparkles, MessageCircleQuestion, CircleHelp, EyeIcon, EyeOffIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@docsurf/ui/components/avatar";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@docsurf/ui/components/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@docsurf/ui/components/sidebar";
import { SidebarThemeSwitchMenuItem } from "./sidebar-theme-switcher-menu-item";
import { SignOutDialog } from "./dialogs/sign-out-dialog";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { getInitials } from "@docsurf/utils/get-initials";
import { clearAllDexieData } from "@/lib/persist/dexie-persist";
import { showToast } from "@docsurf/ui/components/_c/toast/showToast";
import { SparklesIcon, type SparklesIconHandle } from "@/components/assets/animated/sparkles";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

/**
 * NavUser component for displaying the user's avatar, name, and dropdown menu in the sidebar.
 * Uses useUserStore directly. Shows skeletons for name/email/avatar if loading, and handles error states gracefully.
 */
export function NavUser() {
   const user = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const [isClearing, setIsClearing] = useState(false);
   const [showEmail, setShowEmail] = useState(false);
   const sparklesRef = useRef<SparklesIconHandle>(null);
   const navigate = useNavigate();
   // Loading state: both full_name and currentUser are null
   const isLoading = user.data?.name === null && user.data?.email === null;
   // Error state: attempted to load but no user
   const isError = user.data?.name === null && user.data?.email !== null && !user.data?.email;

   // Function to format email for display
   const formatEmail = (email?: string | null) => {
      if (!email) return "";
      if (showEmail) {
         return email;
      }
      const parts = email.split("@");
      if (parts.length === 2) {
         const [username = "", domain = ""] = parts;
         const maskedUsername = `${username.slice(0, 3)}•••`;
         return `${maskedUsername}@${domain}`;
      }
      return `${email.slice(0, 3)}•••`;
   };

   const handleClearCache = async () => {
      setIsClearing(true);
      await clearAllDexieData();
      showToast("Local cache cleared.", "success");
      setIsClearing(false);
   };

   return (
      <SidebarMenuItem>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent h-10 md:h-8 dark:hover:bg-accent/50 hover:bg-accent cursor-pointer data-[state=open]:text-sidebar-accent-foreground"
               >
                  <Avatar className="size-8 md:size-7 rounded-lg">
                     {isLoading ? (
                        <Skeleton className="size-7 rounded-lg" />
                     ) : (
                        <>
                           <AvatarImage src={user.data?.image ?? ""} alt={user.data?.name ?? "User"} />
                           <AvatarFallback className="rounded-lg bg-brand/5">{getInitials(user.data?.name ?? "")}</AvatarFallback>
                        </>
                     )}
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                     {isLoading || !user.data?.name ? (
                        <Skeleton className="h-5 w-full rounded" />
                     ) : isError ? (
                        <span className="truncate font-semibold text-destructive">User not found</span>
                     ) : (
                        <span className="truncate font-semibold">{user.data?.name}</span>
                     )}
                  </div>
                  <ChevronDown className="ml-auto size-3.5" />
               </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
               className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-sm bg-background font-medium"
               side="bottom"
               align="end"
               sideOffset={4}
            >
               <div className="px-1 pt-0.5 pb-1">
                  <div className="border py-0.5 px-2.5 rounded-full text-[10px] font-normal w-fit">Beta</div>
                  {/* User info with show/hide email */}
                  {user.data && (
                     <div className="flex flex-col min-w-0 mt-2">
                        {/* <p className="font-medium text-sm leading-none truncate">{full_name}</p> */}
                        <div className="flex items-center mt-0.5 gap-1">
                           <div
                              className={`text-[11px] text-text-default ${showEmail ? "" : "max-w-[160px] truncate"}`}
                              title={user.data?.email || ""}
                           >
                              {formatEmail(user.data?.email)}
                           </div>
                           <button
                              type="button"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setShowEmail((v) => !v);
                              }}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm"
                              tabIndex={0}
                              aria-label={showEmail ? "Hide email" : "Show email"}
                           >
                              {showEmail ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
                              <span className="sr-only">{showEmail ? "Hide email" : "Show email"}</span>
                           </button>
                        </div>
                     </div>
                  )}
               </div>
               <DropdownMenuGroup>
                  <DropdownMenuItem
                     className="cursor-pointer group"
                     onMouseEnter={() => sparklesRef.current?.startAnimation()}
                     onMouseLeave={() => sparklesRef.current?.stopAnimation()}
                     onClick={() => {
                        navigate({ to: "/settings/subscription" });
                     }}
                  >
                     <SparklesIcon ref={sparklesRef} className="size-3.5 p-0 text-text-default hover:text-text-emphasis" />
                     <span className="text-[13px] text-text-default hover:text-text-emphasis">
                        {user.data?.subscription?.isPremium ? "Manage Subscription" : "Upgrade to Pro"}
                     </span>
                  </DropdownMenuItem>
               </DropdownMenuGroup>
               <DropdownMenuSeparator />
               <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer group" asChild>
                     <Link to="/settings">
                        <Settings className="size-3.5 text-text-default hover:text-text-emphasis" />
                        <span className="text-[13px] text-text-default hover:text-text-emphasis">Settings</span>
                     </Link>
                  </DropdownMenuItem>

                  <SidebarThemeSwitchMenuItem />

                  {/* <FeedbackDialog showTrigger>
                     <DropdownMenuItem className="cursor-pointer group" onSelect={(e) => e.preventDefault()}>
                        <MessageCircleQuestion className="size-4 text-text-default hover:text-text-emphasis" />
                        <span className="text-[13px] text-text-default hover:text-text-emphasis">Give Feedback</span>
                     </DropdownMenuItem>
                  </FeedbackDialog> */}
               </DropdownMenuGroup>
               <DropdownMenuGroup>
                  <SignOutDialog>
                     <DropdownMenuItem className="cursor-pointer group" onSelect={(e) => e.preventDefault()}>
                        <LogOut className="size-3.5 text-text-default hover:text-text-emphasis" />
                        <span className="text-[13px] text-text-default hover:text-text-emphasis">Log out</span>
                     </DropdownMenuItem>
                  </SignOutDialog>
               </DropdownMenuGroup>
               <DropdownMenuSeparator />
               <div className="text-muted-foreground/60 flex items-center justify-center gap-1 px-2 py-1 text-[10px]">
                  <Link to="/policy" className="hover:underline">
                     Privacy
                  </Link>
                  <span>·</span>
                  <Link to="/terms" className="hover:underline">
                     Terms
                  </Link>
               </div>
               <DropdownMenuSeparator />
               <DropdownMenuLabel className="px-3 py-1 text-[10.5px] font-semibold text-muted-foreground">Debug</DropdownMenuLabel>
               <DropdownMenuItem
                  className="cursor-pointer group"
                  onClick={handleClearCache}
                  disabled={isClearing}
                  aria-disabled={isClearing}
                  title="Clear version history"
               >
                  <CircleHelp className="size-3.5 text-text-default hover:text-text-emphasis" />
                  <span className="text-[13px] text-text-default hover:text-text-emphasis">Clear version history</span>
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </SidebarMenuItem>
   );
}
