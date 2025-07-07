import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@/components/auth/sign-in";
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

export const Route = createFileRoute("/_auth/auth")({
   component: SignIn,
   validateSearch: authSearchSchema,
   // beforeLoad: ({ context }) => {
   // if (context.userId) {
   //    throw redirect({ to: "/doc" });
   // }
   // },
});
