import { useCallback, useEffect, useRef } from "react"

interface UseInfiniteScrollOptions {
    /**
     * Whether there's more data to load
     */
    hasMore: boolean
    /**
     * Whether data is currently being loaded
     */
    isLoading: boolean
    /**
     * Callback function to load more data
     */
    onLoadMore: () => void
    /**
     * Root margin for the intersection observer (default: "100px")
     * This triggers loading before the element is fully visible
     */
    rootMargin?: string
    /**
     * Threshold for the intersection observer (default: 0.1)
     */
    threshold?: number
}

/**
 * Custom hook for infinite scrolling using Intersection Observer API
 *
 * @param options Configuration options for the infinite scroll behavior
 * @returns A ref to attach to the sentinel element that triggers loading
 */
export function useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
    rootMargin = "100px",
    threshold = 0.1
}: UseInfiniteScrollOptions) {
    const sentinelRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries

            // Only trigger loading if:
            // 1. The sentinel is intersecting (visible)
            // 2. There's more data to load
            // 3. We're not already loading
            if (entry.isIntersecting && hasMore && !isLoading) {
                onLoadMore()
            }
        },
        [hasMore, isLoading, onLoadMore]
    )

    useEffect(() => {
        // Clean up previous observer
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        // Create new observer
        observerRef.current = new IntersectionObserver(handleIntersection, {
            root: null, // Use viewport as root
            rootMargin,
            threshold
        })

        // Start observing the sentinel element
        const currentSentinel = sentinelRef.current
        if (currentSentinel && observerRef.current) {
            observerRef.current.observe(currentSentinel)
        }

        // Cleanup function
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [handleIntersection, rootMargin, threshold])

    return sentinelRef
}
