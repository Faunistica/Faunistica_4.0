import { useRef, useCallback } from 'react';

/**
 * Returns a debounced version of the callback.
 * The callback is delayed by `delay` ms; each new call resets the timer.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
    callback: T,
    delay: number,
): T {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => callback(...args), delay);
        },
        [callback, delay],
    ) as unknown as T;
}
