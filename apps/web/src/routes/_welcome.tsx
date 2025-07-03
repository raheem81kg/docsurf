import { convexQuery } from "@convex-dev/react-query";
import { api } from "@docsurf/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "@/components/welcome/footer/footer";
import { FooterCTA } from "@/components/welcome/footer/footer-cta";
import Navigation from "@/components/welcome/navigation";

export const Route = createFileRoute("/_welcome")({
   component: LayoutComponent,
});

function LayoutComponent() {
   const user = useQuery(convexQuery(api.auth.getCurrentUser, {}));

   return (
      <div className="relative max-w-full">
         <Navigation
            profile={{
               full_name: user?.data?.name ?? null,
               email: user?.data?.email ?? null,
            }}
         />
         <div className="px-4">
            <Outlet />
         </div>
         <FooterCTA />
         <Footer />
      </div>
   );
}
