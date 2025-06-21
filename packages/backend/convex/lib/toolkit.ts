import type { Tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import type { Infer } from "convex/values"
import type { DataModel } from "../_generated/dataModel"
import type { UserSettings } from "../schema/settings"
import { MCPAdapter } from "./tools/mcp_adapter"
import { SupermemoryAdapter } from "./tools/supermemory"
import { WebSearchAdapter } from "./tools/web_search"

export type ToolAdapter = (params: ConditionalToolParams) => Promise<Partial<Record<string, Tool>>>
export const TOOL_ADAPTERS = [WebSearchAdapter, SupermemoryAdapter, MCPAdapter]
export const ABILITIES = ["web_search", "supermemory", "mcp"] as const
export type AbilityId = (typeof ABILITIES)[number]

export type ConditionalToolParams = {
    ctx: GenericActionCtx<DataModel>
    enabledTools: AbilityId[]
    userSettings: Infer<typeof UserSettings>
}

export const getToolkit = async (
    ctx: GenericActionCtx<DataModel>,
    enabledTools: AbilityId[],
    userSettings: Infer<typeof UserSettings>
): Promise<Record<string, Tool>> => {
    const toolResults = await Promise.all(
        TOOL_ADAPTERS.map((adapter) => adapter({ ctx, enabledTools, userSettings }))
    )

    const tools: Record<string, Tool> = {}
    for (const toolResult of toolResults) {
        for (const [key, value] of Object.entries(toolResult)) {
            if (value) {
                tools[key] = value
            }
        }
    }

    console.log("tools", Object.keys(tools))
    return tools
}
