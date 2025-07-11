// import { convexQuery } from "@convex-dev/react-query";
// import { api } from "@docsurf/backend/convex/_generated/api";
// import { useSuspenseQuery } from "@tanstack/react-query";
// import { createFileRoute, useNavigate } from "@tanstack/react-router";
// import { useTransition } from "react";
// import { Toaster } from "sonner";
// import { SignOutButton } from "@/components/client";
// import { ModeToggle } from "@/components/mode-toggle";
// import { AppContainer, AppHeader, AppNav, SettingsButton, UserProfile } from "@/components/server";
// import { TodoList } from "@/components/TodoListServer";
// import { authClient } from "@/lib/auth-client";

// export const Route = createFileRoute("/_authed/server")({
//    component: ServerComponent,
// });

// function ServerComponent() {
//    const navigate = useNavigate();
//    const [isPending, startTransition] = useTransition();

//    return (
//       <AppContainer>
//          <ModeToggle
//             isServer={true}
//             onSwitch={() => {
//                startTransition(() => {
//                   void navigate({ to: "/client-only" });
//                });
//             }}
//             isPending={isPending}
//          />
//          <Header />
//          <TodoList />
//          <Toaster />
//       </AppContainer>
//    );
// }

// function Header() {
//    const user = useSuspenseQuery(convexQuery(api.auth.getCurrentUser, {}));
//    const navigate = useNavigate();

//    const handleSignOut = async () => {
//       await authClient.signOut();
//       void navigate({ to: "/" });
//    };

//    return (
//       <AppHeader>
//          <UserProfile
//             user={{
//                name: user.data?.name ?? "",
//                email: user.data?.email ?? "",
//                image: user.data?.image ?? "",
//             }}
//          />
//          <AppNav>
//             <SettingsButton>
//                {/*
//           <Link to="/settings">
//             <SettingsButtonContent />
//           </Link>
//           */}
//             </SettingsButton>
//             <SignOutButton onClick={handleSignOut} />
//          </AppNav>
//       </AppHeader>
//    );
// }
