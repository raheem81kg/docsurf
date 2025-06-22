export const ABILITIES = ["web_search", "supermemory", "mcp"] as const;
export type AbilityId = (typeof ABILITIES)[number];
export type BaseAspects = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2";
export type BaseResolution = `${number}x${number}`;
export type AllAspects = (BaseAspects | `${BaseAspects}-hd`) & {};
export type ImageSize = (AllAspects | BaseResolution) & {};
