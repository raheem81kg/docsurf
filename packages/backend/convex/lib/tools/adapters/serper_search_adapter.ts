import type {
    SearchAdapter,
    SearchAdapterConfig,
    SearchOptions,
    SearchResult
} from "./search_adapter"

export interface SerperSearchConfig extends SearchAdapterConfig {
    apiKey: string
    baseUrl?: string
    scrapeUrl?: string
}

interface SerperSearchResponse {
    searchParameters: {
        q: string
        gl: string
        hl: string
        type: string
    }
    organic: Array<{
        title: string
        link: string
        snippet: string
        position: number
        sitelinks?: Array<{
            title: string
            link: string
        }>
    }>
    knowledgeGraph?: {
        title: string
        type: string
        website: string
        description: string
        descriptionSource: string
        descriptionLink: string
    }
    peopleAlsoAsk?: Array<{
        question: string
        snippet: string
        title: string
        link: string
    }>
}

interface SerperScrapeResponse {
    url: string
    title: string
    text: string
    markdown?: string
}

export class SerperSearchAdapter implements SearchAdapter {
    readonly name = "serper"
    private config: SerperSearchConfig
    private readonly MAX_CONTEXT_WINDOW = 24000 // 24k characters max

    constructor(config: SerperSearchConfig) {
        this.config = {
            baseUrl: "https://google.serper.dev/search",
            scrapeUrl: "https://scrape.serper.dev",
            ...config
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const { limit = 5, scrapeContent = false } = options

        try {
            // Step 1: Perform the search
            const searchResults = await this.performSearch(query, limit)

            if (!scrapeContent) {
                return searchResults
            }

            // Step 2: Scrape content from search results if requested
            return await this.scrapeAndEnrichResults(searchResults)
        } catch (error) {
            console.error("Serper search error:", error)
            throw new Error(
                `Failed to search with Serper: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }

    private async performSearch(query: string, limit: number): Promise<SearchResult[]> {
        const response = await fetch(this.config.baseUrl!, {
            method: "POST",
            headers: {
                "X-API-KEY": this.config.apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q: query,
                num: Math.min(limit, 10) // Serper typically returns up to 10 results
            })
        })

        if (!response.ok) {
            throw new Error(`Serper search failed: ${response.status} ${response.statusText}`)
        }

        const data: SerperSearchResponse = await response.json()

        if (!data.organic || data.organic.length === 0) {
            return []
        }

        // Include knowledge graph information if available
        const results: SearchResult[] = data.organic.map((item) => ({
            url: item.link,
            title: item.title,
            description: item.snippet || ""
        }))

        // Add knowledge graph as first result if available
        if (data.knowledgeGraph) {
            results.unshift({
                url: data.knowledgeGraph.website || data.knowledgeGraph.descriptionLink,
                title: data.knowledgeGraph.title,
                description: data.knowledgeGraph.description
            })
        }

        return results.slice(0, limit)
    }

    private async scrapeAndEnrichResults(results: SearchResult[]): Promise<SearchResult[]> {
        const scrapingJobs = results.map((result) =>
            this.scrapeUrl(result.url)
                .then((scrapedContent) => {
                    if (scrapedContent) {
                        return {
                            ...result,
                            content: scrapedContent.text,
                            markdown: scrapedContent.markdown || scrapedContent.text
                        }
                    }
                    return result
                })
                .catch((error) => {
                    console.warn(`Failed to scrape ${result.url}:`, error)
                    return result
                })
        )

        const scrapedResults = await Promise.all(scrapingJobs)

        const enrichedResults: SearchResult[] = []
        let totalContextUsed = 0

        for (const result of scrapedResults) {
            if (result.content && totalContextUsed < this.MAX_CONTEXT_WINDOW) {
                const remainingContext = this.MAX_CONTEXT_WINDOW - totalContextUsed
                if (result.content.length <= remainingContext) {
                    enrichedResults.push(result)
                    totalContextUsed += result.content.length
                } else {
                    const truncatedContent = `${result.content.substring(0, remainingContext)}...`
                    enrichedResults.push({
                        ...result,
                        content: truncatedContent,
                        markdown: result.markdown
                            ? `${result.markdown.substring(0, remainingContext)}...`
                            : truncatedContent
                    })
                    totalContextUsed = this.MAX_CONTEXT_WINDOW
                }
            } else {
                const { content, markdown, ...rest } = result as any
                enrichedResults.push(rest)
            }
        }

        return enrichedResults
    }

    private async scrapeUrl(url: string): Promise<SerperScrapeResponse | null> {
        try {
            const response = await fetch(this.config.scrapeUrl!, {
                method: "POST",
                headers: {
                    "X-API-KEY": this.config.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ url })
            })

            if (!response.ok) {
                return null
            }

            return await response.json()
        } catch (error) {
            console.warn(`Failed to scrape URL ${url}:`, error)
            return null
        }
    }
}
