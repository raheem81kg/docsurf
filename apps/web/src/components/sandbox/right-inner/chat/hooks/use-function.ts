import { useCallback, useRef } from "react"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Callback<T extends any[] = any[], R = any> = (...args: T) => R

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function useFunction<T extends any[] = any[], R = any>(
    callback: Callback<T, R>
): Callback<T, R> {
    const ref = useRef<Callback<T, R>>(null)
    ref.current = callback

    return useCallback((...args: T) => {
        const callback = ref.current
        if (typeof callback === "function") {
            return callback(...args)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }, []) as any
}
