import type {
    SearchAdapter,
    SearchAdapterConfig,
    SearchOptions,
    SearchResult
} from "./search_adapter"

interface BraveSearchResponse {
    type: string
    web?: {
        type: string
        results: Array<{
            title: string
            url: string
            description?: string
            age?: string
            language?: string
            page_age?: string
            page_fetched?: string
            family_friendly?: boolean
        }>
        family_friendly?: boolean
    }
    query?: {
        original: string
        altered?: string
        safesearch?: boolean
        is_navigational?: boolean
        is_geolocal?: boolean
        country?: string
    }
}

export interface BraveSearchConfig extends SearchAdapterConfig {
    apiKey: string
    baseUrl?: string
    country?: string
    searchLang?: string
    safesearch?: "off" | "moderate" | "strict"
}

export class BraveSearchAdapter implements SearchAdapter {
    readonly name = "brave"
    private config: BraveSearchConfig

    constructor(config: BraveSearchConfig) {
        this.config = {
            baseUrl: "https://api.search.brave.com/res/v1/web/search",
            country: "US",
            searchLang: "en",
            safesearch: "moderate",
            ...config
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const { limit = 5 } = options

        const params = new URLSearchParams({
            q: query,
            count: Math.min(limit, 20).toString(),
            country: this.config.country!,
            search_lang: this.config.searchLang!,
            safesearch: this.config.safesearch!
        })

        try {
            const response = await fetch(`${this.config.baseUrl}?${params}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": this.config.apiKey
                }
            })

            if (!response.ok) {
                throw new Error(`Brave search failed: ${response.status} ${response.statusText}`)
            }

            const data: BraveSearchResponse = await response.json()

            if (!data.web?.results) {
                return []
            }

            return data.web.results.map((item) => ({
                url: item.url,
                title: item.title,
                description: item.description || ""
            }))
        } catch (error) {
            console.error("Brave search error:", error)
            throw new Error(
                `Failed to search with Brave: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }
}
