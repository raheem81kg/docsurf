import type { Id } from "@/convex/_generated/dataModel"

export interface Thread {
    _id: Id<"threads">
    title: string
    createdAt: number
    authorId: string
    pinned?: boolean
    projectId?: Id<"projects">
}

export interface Project {
    _id: Id<"projects">
    name: string
    description?: string
    color?: string
    icon?: string
}
