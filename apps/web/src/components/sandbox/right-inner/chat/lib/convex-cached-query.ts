import { useQuery } from "convex-helpers/react/cache"
import {
    type OptionalRestArgsOrSkip,
    type PaginatedQueryArgs,
    type PaginatedQueryReference,
    usePaginatedQuery
} from "convex/react"
import type { FunctionReference } from "convex/server"
import { useEffect, useMemo, useState } from "react"
type IsArrayType<T> = T extends readonly unknown[] ? true : false

type CachedItem<
    T,
    IsArray extends boolean = false,
    ExtraProps extends Record<string, any> = Record<string, never>
> = IsArray extends true
    ? T extends readonly unknown[]
        ? (T[number] & ExtraProps)[]
        : never
    : T & ExtraProps

export const useDiskCachedQuery = <
    Query extends FunctionReference<"query">,
    ExtraProps extends Record<string, any>,
    T = ReturnType<typeof useQuery<Query>>,
    IsArray extends boolean = IsArrayType<T>
>(
    query: Query,
    cacheOptions: {
        key: string
        maxItems?: number
        default: ReturnType<typeof useQuery<Query>>
        forceCache?: boolean
    },
    ...args: OptionalRestArgsOrSkip<Query>
) => {
    const isClient = typeof window !== "undefined"
    const result = useQuery(query, ...args)
    const [disk_cache, setDiskCache] = useState<CachedItem<T, IsArray, ExtraProps>>(() => {
        if (!isClient) return cacheOptions.default as CachedItem<T, IsArray, ExtraProps>
        const cache = localStorage.getItem(`CVX_DISK_CACHE:${cacheOptions.key}`)
        return cache
            ? JSON.parse(cache)
            : (cacheOptions.default as CachedItem<T, IsArray, ExtraProps>)
    })

    useEffect(() => {
        if (!isClient) return

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === `CVX_DISK_CACHE:${cacheOptions.key}` && e.newValue) {
                try {
                    const newCache = JSON.parse(e.newValue)
                    setDiskCache(newCache)
                } catch (error) {
                    console.warn("Failed to parse localStorage cache update:", error)
                }
            }
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [cacheOptions.key, isClient])

    const output: CachedItem<T, IsArray, ExtraProps> | { error: unknown } =
        args.length > 0 && args[0] === "skip" && !cacheOptions.forceCache
            ? (cacheOptions.default as CachedItem<T, IsArray, ExtraProps>)
            : (result ?? disk_cache)

    useEffect(() => {
        if (!result || "error" in result) return
        if (cacheOptions.maxItems && Array.isArray(result)) {
            localStorage.setItem(
                `CVX_DISK_CACHE:${cacheOptions.key}`,
                JSON.stringify(result.slice(0, cacheOptions.maxItems))
            )
        } else {
            localStorage.setItem(`CVX_DISK_CACHE:${cacheOptions.key}`, JSON.stringify(result))
        }
    }, [result, cacheOptions.key])

    return output
}

export const useDiskCachedPaginatedQuery = <
    ExtraProps extends Record<string, any>,
    Query extends PaginatedQueryReference
>(
    query: Query,
    cacheOptions: { key: string; maxItems?: number },
    args: PaginatedQueryArgs<Query> | "skip",
    options: { initialNumItems: number }
) => {
    const { results, status, loadMore } = usePaginatedQuery(query, args, options)
    const [acceptEmptyResults, setAcceptEmptyResults] = useState(false)

    const disk_cache: ((typeof results)[number] & ExtraProps)[] = useMemo(() => {
        if (typeof window === "undefined") return []
        const cache = localStorage.getItem(`CVX_DISK_CACHE:${cacheOptions.key}`)
        return cache ? JSON.parse(cache) : []
    }, [cacheOptions.key])

    // Debounce logic for "Exhausted" state with empty results
    useEffect(() => {
        if (status === "Exhausted" && results.length === 0 && disk_cache.length > 0) {
            // Wait 500ms before accepting empty results as truth
            const timer = setTimeout(() => {
                setAcceptEmptyResults(true)
            }, 500)
            return () => clearTimeout(timer)
        }
        if (results.length > 0) {
            // Reset if we get actual results
            setAcceptEmptyResults(false)
        }
    }, [status, results.length, disk_cache.length])

    const output: ((typeof results)[number] & ExtraProps)[] =
        status === "LoadingFirstPage" ||
        (results.length === 0 && disk_cache.length > 0 && !acceptEmptyResults)
            ? disk_cache
            : results

    useEffect(() => {
        if (!results || status === "LoadingFirstPage") return
        if (cacheOptions.maxItems && Array.isArray(results)) {
            localStorage.setItem(
                `CVX_DISK_CACHE:${cacheOptions.key}`,
                JSON.stringify(results.slice(0, cacheOptions.maxItems))
            )
        } else {
            localStorage.setItem(`CVX_DISK_CACHE:${cacheOptions.key}`, JSON.stringify(results))
        }
    }, [results, cacheOptions.key])

    return { results: output, loadMore, status }
}

export const clearDiskCache = () => {
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("CVX_DISK_CACHE:")) {
            localStorage.removeItem(key)
        }
    })
}
