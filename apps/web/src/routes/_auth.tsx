import { AuthLayout } from "@/components/auth/auth-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
   head: () => ({
      meta: [
         {
            title: "Sign In - Docsurf",
         },
         {
            name: "description",
            content: "Sign in to your Docsurf account to access your AI-powered documents and collaborate with your team.",
         },
         {
            name: "robots",
            content: "noindex, nofollow", // Auth pages shouldn't be indexed
         },
      ],
   }),
   component: LayoutComponent,
});

function LayoutComponent() {
   return (
      <AuthLayout>
         <div className="w-full max-w-md overflow-hidden">
            <Outlet />
         </div>
      </AuthLayout>
   );
}
