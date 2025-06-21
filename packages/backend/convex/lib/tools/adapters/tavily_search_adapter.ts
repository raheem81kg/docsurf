import type {
    SearchAdapter,
    SearchAdapterConfig,
    SearchOptions,
    SearchResult
} from "./search_adapter"

export interface TavilySearchConfig extends SearchAdapterConfig {
    apiKey: string
    baseUrl?: string
}

interface TavilySearchRequest {
    query: string
    search_depth?: "basic" | "advanced"
    topic?: "general" | "news"
    max_results?: number
    chunks_per_source?: number
    include_raw_content?: boolean
    include_answer?: boolean
    include_images?: boolean
    include_image_descriptions?: boolean
    include_domains?: string[]
    exclude_domains?: string[]
    days?: number
    country?: string
}

interface TavilySearchResponse {
    query: string
    answer?: string
    images?: Array<{
        url: string
        description?: string
    }>
    results: Array<{
        title: string
        url: string
        content: string
        score: number
        raw_content?: string
    }>
    response_time: string
}

export class TavilySearchAdapter implements SearchAdapter {
    readonly name = "tavily"
    private config: TavilySearchConfig

    constructor(config: TavilySearchConfig) {
        this.config = {
            baseUrl: "https://api.tavily.com",
            ...config
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const { limit = 5, scrapeContent = false } = options

        try {
            // Use advanced search with chunks when scraping content, otherwise basic
            const searchDepth = scrapeContent ? "advanced" : "basic"
            const chunksPerSource = scrapeContent ? 8 : 3 // 5-10 chunks per source as requested

            const requestBody: TavilySearchRequest = {
                query,
                search_depth: searchDepth,
                topic: "general",
                max_results: Math.min(limit, 20), // Tavily max is 20
                chunks_per_source: chunksPerSource,
                include_raw_content: scrapeContent,
                include_answer: false, // We don't need AI-generated answers
                include_images: false,
                include_image_descriptions: false
            }

            const response = await fetch(`${this.config.baseUrl}/search`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                throw new Error(`Tavily API error: ${response.status} ${response.statusText}`)
            }

            const data: TavilySearchResponse = await response.json()

            if (!data.results || data.results.length === 0) {
                return []
            }

            return data.results.map((result) => ({
                url: result.url,
                title: result.title,
                description: result.content || "",
                ...(result.raw_content && {
                    content: result.raw_content,
                    markdown: result.raw_content
                })
            }))
        } catch (error) {
            console.error("Tavily search error:", error)
            throw new Error(
                `Failed to search with Tavily: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }
}
