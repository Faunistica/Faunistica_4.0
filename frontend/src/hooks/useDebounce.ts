import { useRef, useCallback, useEffect } from 'react';

/**
 * Returns a debounced version of the callback.
 * The callback is delayed by `delay` ms; each new call resets the timer.
 */
// oxlint-disable-next-line typescript/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
): { fn: (...args: Parameters<T>) => void; cancel: () => void } {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const fn = useCallback(
        (...args: Parameters<T>) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                callbackRef.current(...args);
            }, delay);
        },
        [delay],
    );

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return { fn, cancel };
}
