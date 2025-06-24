/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: <explanation> */
import { SettingsLayout } from "@/components/sandbox/right-inner/chat/settings/settings-layout";
import { Button } from "@docsurf/ui/components/button";
import { Skeleton } from "@docsurf/ui/components/skeleton";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useSession } from "@/hooks/auth-hooks";
import { cn } from "@docsurf/ui/lib/utils";
import { useConvexQuery } from "@convex-dev/react-query";
import { Outlet, createLazyFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Bot, Box, Key, PaintBucket, Paperclip, User, CreditCard } from "lucide-react";
import { type ReactNode, useEffect } from "react";

interface SettingsLayoutProps {
   children?: ReactNode;
   title?: string;
   description?: string;
}

const settingsNavItems = [
   {
      title: "Profile",
      href: "/settings/profile",
      icon: User,
   },
   {
      title: "Providers",
      href: "/settings/providers",
      icon: Key,
   },
   {
      title: "Models",
      href: "/settings/models",
      icon: Box,
   },
   {
      title: "AI Options",
      href: "/settings/ai-options",
      icon: Bot,
   },
   {
      title: "Customization",
      href: "/settings/customization",
      icon: PaintBucket,
   },
   {
      title: "Usage Analytics",
      href: "/settings/usage",
      icon: BarChart3,
   },
   {
      title: "Attachments",
      href: "/settings/attachments",
      icon: Paperclip,
   },
   {
      title: "Appearance",
      href: "/settings/appearance",
      icon: PaintBucket,
   },
   {
      title: "Subscription",
      href: "/settings/subscription",
      icon: CreditCard,
   },
];

export const Route = createLazyFileRoute("/settings")({
   component: SettingsPage,
});

const Inner = () => {
   const { data: session } = useSession();
   const userSettings = useConvexQuery(api.settings.getUserSettings, session?.user?.id ? {} : "skip");
   if (!session?.user?.id) {
      return (
         <SettingsLayout title="API Keys" description="Manage your models and providers. Keys are encrypted and stored securely.">
            <p className="text-muted-foreground text-sm">Sign in to manage your settings.</p>
         </SettingsLayout>
      );
   }
   if (!userSettings) {
      return (
         <SettingsLayout title="API Keys" description="Manage your models and providers. Keys are encrypted and stored securely.">
            <Skeleton className="h-10 w-full" />
         </SettingsLayout>
      );
   }
   if ("error" in userSettings) {
      return (
         <SettingsLayout title="API Keys" description="Manage your models and providers. Keys are encrypted and stored securely.">
            <p className="text-muted-foreground text-sm">Error loading settings.</p>
         </SettingsLayout>
      );
   }

   return <Outlet />;
};

function SettingsPage({ title, description }: SettingsLayoutProps) {
   console.log("title", title, "description", description);
   const location = useLocation();
   const navigate = useNavigate();

   useEffect(() => {
      if (location.pathname === "/settings" || location.pathname === "/settings/") {
         navigate({
            to: "/settings/profile",
            replace: true,
         });
      }
   }, [location.pathname, navigate]);

   return (
      <div className="flex h-screen flex-col overflow-y-auto bg-background">
         <div className="container mx-auto flex max-w-6xl flex-1 flex-col p-3 pb-6 lg:max-h-dvh lg:overflow-y-hidden lg:p-6">
            {/* Header */}
            <div className="mb-8 max-md:px-2">
               <div className="mb-6 flex items-center gap-4">
                  <Link to="/doc">
                     <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                     </Button>
                  </Link>
               </div>

               <div className="space-y-1">
                  <h1 className="font-semibold text-3xl tracking-tight">Settings</h1>
                  <p className="text-muted-foreground">Manage your account preferences and configuration.</p>
               </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-4">
               {/* Navigation */}
               <div className="w-full flex-shrink-0 lg:w-64 lg:pr-2">
                  <nav className="w-full space-y-1">
                     {settingsNavItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;

                        return (
                           <Link
                              key={item.href}
                              to={item.href}
                              className={cn(
                                 "flex w-full items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                                 isActive
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                           >
                              <Icon className="h-4 w-4" />
                              {item.title}
                           </Link>
                        );
                     })}
                  </nav>
               </div>

               {/* Main Content */}
               <div className="col-span-3 flex-1">
                  <div className="space-y-6 p-0.5 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
                     <Inner />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
