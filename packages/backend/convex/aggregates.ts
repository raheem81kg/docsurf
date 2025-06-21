import { TableAggregate } from "@convex-dev/aggregate"
import { components } from "./_generated/api"
import type { DataModel, Id } from "./_generated/dataModel"

export const aggregrateThreadsByFolder = new TableAggregate<{
    Namespace: [string, Id<"projects"> | null]
    Key: number
    DataModel: DataModel
    TableName: "threads"
}>(components.aggregateFolderThreads, {
    namespace: (doc) => [doc.authorId, doc.projectId || null],
    sortKey: (doc) => doc._creationTime
})
