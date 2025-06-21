export interface SearchResult {
    url: string
    title: string
    description: string
    content?: string
    markdown?: string
}

export interface SearchOptions {
    limit?: number
    scrapeContent?: boolean
    formats?: string[]
}

export interface SearchAdapter {
    readonly name: string
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>
}

export interface SearchAdapterConfig {
    apiKey?: string
    baseUrl?: string
}
