import { useRef, useCallback, useEffect } from 'react';

/**
 * Returns a debounced version of the callback.
 * The callback is delayed by `delay` ms; each new call resets the timer.
 */
// oxlint-disable-next-line typescript/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
): (...args: Parameters<T>) => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    });

    return useCallback(
        (...args: Parameters<T>) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
        },
        [delay],
    );
}
