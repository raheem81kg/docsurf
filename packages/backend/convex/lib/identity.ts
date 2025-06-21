import type { Auth, UserIdentity } from "convex/server"

type Identity<T extends boolean> = T extends false
    ? UserIdentity & { isAnonymous: false; id: string }
    : UserIdentity & { isAnonymous: boolean; id: string }

export const getUserIdentity = async <T extends boolean>(
    auth: Auth,
    { allowAnons }: { allowAnons: T }
): Promise<{ error: string } | Identity<T>> => {
    const identity = await auth.getUserIdentity()

    if (!identity) {
        return { error: "Unauthorized" }
    }

    if (!allowAnons && identity.isAnonymous) {
        return { error: "Unauthorized (anonymous)" }
    }

    return {
        ...identity,
        id: identity.subject
    } as Identity<T>
}

export const getOrThrowUserIdentity = async <T extends boolean>(
    auth: Auth,
    { allowAnons }: { allowAnons: T }
): Promise<Identity<T>> => {
    const result = await getUserIdentity(auth, { allowAnons })

    if ("error" in result) {
        throw new Error(result.error === "Unauthorized" ? "Unauthorized" : "User not authenticated")
    }

    return result
}
