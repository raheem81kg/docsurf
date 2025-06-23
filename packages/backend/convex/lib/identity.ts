import type { UserIdentity } from "convex/server";
import type { GenericActionCtx, GenericQueryCtx } from "convex/server";
import { betterAuthComponent } from "../auth";

type Identity<T extends boolean> = T extends false
   ? UserIdentity & { isAnonymous: false; id: string }
   : UserIdentity & { isAnonymous: boolean; id: string };

export const getUserIdentity = async <T extends boolean>(
   ctx: GenericQueryCtx<any> | GenericActionCtx<any>,
   { allowAnons }: { allowAnons: T }
): Promise<{ error: string } | Identity<T>> => {
   const identity = await betterAuthComponent.getAuthUser(ctx);

   if (!identity) {
      return { error: "Unauthorized" };
   }

   // The concept of "anonymous" users may need to be adapted based on better-auth's user model
   // For now, we assume if an identity exists, it is not anonymous.
   // const isAnonymous = false;
   // if (!allowAnons && isAnonymous) {
   // 	return { error: "Unauthorized (anonymous)" };
   // }

   return {
      ...(identity as any), // NOTE: This needs to be checked for compatibility with UserIdentity
      id: identity.userId,
   } as Identity<T>;
};

export const getOrThrowUserIdentity = async <T extends boolean>(
   ctx: GenericQueryCtx<any> | GenericActionCtx<any>,
   { allowAnons }: { allowAnons: T }
): Promise<Identity<T>> => {
   const result = await getUserIdentity(ctx, { allowAnons });

   if ("error" in result) {
      throw new Error(result.error === "Unauthorized" ? "Unauthorized" : "User not authenticated");
   }

   return result;
};
