import { BraveSearchAdapter, type BraveSearchConfig } from "./brave_search_adapter"
import { FirecrawlSearchAdapter, type FirecrawlSearchConfig } from "./firecrawl_search_adapter"
import type { SearchAdapter, SearchOptions, SearchResult } from "./search_adapter"
import { SerperSearchAdapter, type SerperSearchConfig } from "./serper_search_adapter"
import { TavilySearchAdapter, type TavilySearchConfig } from "./tavily_search_adapter"

export type SearchProviderType = "firecrawl" | "brave" | "tavily" | "serper"

export interface SearchProviderConfig {
    provider: SearchProviderType
    apiKey?: string
    config?: Partial<
        FirecrawlSearchConfig | BraveSearchConfig | TavilySearchConfig | SerperSearchConfig
    >
}

export class SearchProvider {
    private adapter: SearchAdapter

    constructor({ provider, apiKey, config = {} }: SearchProviderConfig) {
        switch (provider) {
            case "firecrawl": {
                const firecrawlApiKey = apiKey || process.env.FIRECRAWL_API_KEY
                if (!firecrawlApiKey) {
                    throw new Error("Firecrawl API key is not set")
                }
                this.adapter = new FirecrawlSearchAdapter({
                    apiKey: firecrawlApiKey,
                    ...config
                } as FirecrawlSearchConfig)
                break
            }
            case "brave": {
                const braveApiKey = apiKey || process.env.BRAVE_API_KEY
                if (!braveApiKey) {
                    throw new Error("Brave API key is not set")
                }
                this.adapter = new BraveSearchAdapter({
                    apiKey: braveApiKey,
                    ...config
                } as BraveSearchConfig)
                break
            }
            case "tavily": {
                const tavilyApiKey = apiKey || process.env.TAVILY_API_KEY
                if (!tavilyApiKey) {
                    throw new Error("Tavily API key is not set")
                }
                this.adapter = new TavilySearchAdapter({
                    apiKey: tavilyApiKey,
                    ...config
                } as TavilySearchConfig)
                break
            }
            case "serper": {
                const serperApiKey = apiKey || process.env.SERPER_API_KEY
                if (!serperApiKey) {
                    throw new Error("Serper API key is not set")
                }
                this.adapter = new SerperSearchAdapter({
                    apiKey: serperApiKey,
                    ...config
                } as SerperSearchConfig)
                break
            }
            default:
                throw new Error(`Unsupported search provider: ${provider}`)
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        return await this.adapter.search(query, options)
    }
}
