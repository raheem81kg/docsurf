import { api } from "@docsurf/backend/convex/_generated/api";
import { useSession } from "./auth-hooks";
import { useMutation, useQuery } from "convex/react";

export function useOnboarding() {
   const { data: session } = useSession();
   const onboardingStatus = useQuery(api.settings.getOnboardingStatus);
   const completeOnboardingMutation = useMutation(api.settings.completeOnboarding);

   // Only show onboarding if user is logged in and the server says to show it
   const shouldShowOnboarding =
      !!session?.user?.id && onboardingStatus && !("error" in onboardingStatus) && onboardingStatus.shouldShowOnboarding;

   const isLoading = !session || onboardingStatus === undefined;

   const completeOnboarding = async () => {
      if (!session?.user?.id) return;

      try {
         await completeOnboardingMutation();
      } catch (error) {
         console.error("Error completing onboarding:", error);
      }
   };

   return {
      shouldShowOnboarding,
      isLoading,
      completeOnboarding,
   };
}
