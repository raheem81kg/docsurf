import { AuthLayout } from "@/components/auth/auth-layout";
import { SignIn } from "@/components/auth/sign-in";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const authSearchSchema = z.object({
   provider: z
      .string()
      .optional()
      .transform((val) => {
         if (val === "google" || val === "otp") {
            return val;
         }
         return undefined;
      }),
});

export const Route = createFileRoute("/auth")({
   ssr: false,
   head: () => ({
      meta: [
         {
            title: "Sign In - DocSurf | AI Document Editor",
         },
         {
            name: "description",
            content:
               "Sign in to your DocSurf account to access your AI-powered documents, smart autocomplete, and intelligent writing assistance. Start writing smarter today.",
         },
         {
            name: "robots",
            content: "noindex, nofollow", // Auth pages shouldn't be indexed
         },
      ],
   }),
   validateSearch: authSearchSchema,
   component: LayoutComponent,
});

function LayoutComponent() {
   const search = Route.useSearch();
   return (
      <AuthLayout>
         <div className="w-full max-w-md overflow-hidden">
            <SignIn provider={search.provider} />
         </div>
      </AuthLayout>
   );
}
