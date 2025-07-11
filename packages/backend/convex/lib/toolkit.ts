import type { Tool } from "ai";
import type { GenericActionCtx } from "convex/server";
import type { Infer } from "convex/values";
import type { DataModel } from "../_generated/dataModel";
import type { UserSettings } from "../schema/settings";
import { MCPAdapter } from "./tools/mcp_adapter";
import { SupermemoryAdapter } from "./tools/supermemory";
import { WebSearchAdapter } from "./tools/web_search";
import type { AbilityId } from "@docsurf/utils/chat/chat-constants";
import { DocumentContextAdapter } from "./tools/document_context";

export type ToolRequestContext = {
   userSettings: Infer<typeof UserSettings>;
   currentDocumentId?: string;
   workspaceId?: string;
   // Add more ephemeral/request-scoped fields as needed
};

export type ToolAdapter = (params: {
   ctx: GenericActionCtx<DataModel>;
   enabledTools: AbilityId[];
   toolRequestContext: ToolRequestContext;
}) => Promise<Partial<Record<string, Tool>>>;
export const TOOL_ADAPTERS = [WebSearchAdapter, SupermemoryAdapter, MCPAdapter, DocumentContextAdapter];

export const getToolkit = async (
   ctx: GenericActionCtx<DataModel>,
   enabledTools: AbilityId[],
   toolRequestContext: ToolRequestContext
): Promise<Record<string, Tool>> => {
   const toolResults = await Promise.all(TOOL_ADAPTERS.map((adapter) => adapter({ ctx, enabledTools, toolRequestContext })));

   const tools: Record<string, Tool> = {};
   for (const toolResult of toolResults) {
      for (const [key, value] of Object.entries(toolResult)) {
         if (value) {
            tools[key] = value;
         }
      }
   }

   console.log("tools", Object.keys(tools));
   return tools;
};
