import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { SignOutButton } from "@/components/client";
import { ModeToggle } from "@/components/mode-toggle";
import { AppContainer, AppHeader, AppNav, SettingsButton, UserProfile } from "@/components/server";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authed/client-only")({
   component: ClientOnlyComponent,
});

function ClientOnlyComponent() {
   const navigate = useNavigate();
   const [isPending, startTransition] = useTransition();
   return (
      <AppContainer>
         <ModeToggle
            isServer={false}
            onSwitch={() => {
               startTransition(() => {
                  void navigate({
                     to: "/server",
                  });
               });
            }}
            isPending={isPending}
         />
         <Header />
         <Outlet />
      </AppContainer>
   );
}

function Header() {
   const user = useQuery(convexQuery(api.auth.getCurrentUser, {}));
   const navigate = useNavigate();

   const handleSignOut = async () => {
      await authClient.signOut();
      void navigate({ to: "/auth" });
   };

   return (
      <AppHeader>
         <UserProfile user={user.data} />
         <AppNav>
            <SettingsButton>
               {/*
          <Link to="/settings">
            <SettingsButtonContent />
          </Link>
          */}
            </SettingsButton>
            <SignOutButton onClick={handleSignOut} />
         </AppNav>
      </AppHeader>
   );
}
