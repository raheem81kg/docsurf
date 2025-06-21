import type {
    SearchAdapter,
    SearchAdapterConfig,
    SearchOptions,
    SearchResult
} from "./search_adapter"

interface FirecrawlSearchResponse {
    success: boolean
    data: Array<{
        url: string
        title: string
        description: string
        markdown?: string
        content?: string
    }>
}

export interface FirecrawlSearchConfig extends SearchAdapterConfig {
    apiKey: string
    baseUrl?: string
}

export class FirecrawlSearchAdapter implements SearchAdapter {
    readonly name = "firecrawl"
    private config: FirecrawlSearchConfig

    constructor(config: FirecrawlSearchConfig) {
        this.config = {
            baseUrl: "https://api.firecrawl.dev",
            ...config
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const { limit = 5, scrapeContent = false, formats = [] } = options

        const requestBody: any = {
            query,
            limit
        }

        if (scrapeContent || formats.length > 0) {
            requestBody.scrapeOptions = {
                formats: formats.length > 0 ? formats : ["markdown", "links"]
            }
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/v1/search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                throw new Error(
                    `Firecrawl search failed: ${response.status} ${response.statusText}`
                )
            }

            const data: FirecrawlSearchResponse = await response.json()

            if (!data.success) {
                throw new Error("Firecrawl search returned unsuccessful response")
            }

            return data.data.map((item) => ({
                url: item.url,
                title: item.title,
                description: item.description,
                content: item.content,
                markdown: item.markdown
            }))
        } catch (error) {
            console.error("Firecrawl search error:", error)
            throw new Error(
                `Failed to search with Firecrawl: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }
}
