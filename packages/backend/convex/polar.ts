import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";

export const polar = new Polar(components.polar, {
   // Required: provide a function the component can use to get the current user's ID and
   // email - this will be used for retrieving the correct subscription data for the
   // current user. The function should return an object with `userId` and `email`
   // properties.
   getUserInfo: async (ctx): Promise<{ userId: string; email: string }> => {
      const user = await ctx.runQuery(api.auth.getCurrentUser);
      if (!user || !user.userId) {
         throw new Error("User not authenticated");
      }

      return {
         userId: user.userId,
         email: user.email,
      };
   },
});

export const {
   changeCurrentSubscription,
   cancelCurrentSubscription,
   getConfiguredProducts,
   listAllProducts,
   generateCheckoutLink,
   generateCustomerPortalUrl,
} = polar.api();
