import { AuthLayout } from "@/components/auth/auth-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
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
