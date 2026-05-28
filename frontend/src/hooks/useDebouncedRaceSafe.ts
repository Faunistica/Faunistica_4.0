import { useState, useRef, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from './useDebounce';

export function useDebouncedRaceSafe<TQuery, TResult>(
    fetcher: (query: TQuery, signal: AbortSignal) => Promise<TResult>,
    onResult: (result: TResult) => void,
    delay: number,
): { fn: (query: TQuery) => void; cancel: () => void; isPending: boolean } {
    const [isPending, setIsPending] = useState(false);
    const versionRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const onResultRef = useRef(onResult);
    const fetcherRef = useRef(fetcher);

    useEffect(() => {
        onResultRef.current = onResult;
    });
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    const { fn: debouncedFn, cancel: cancelDebounce } = useDebouncedCallback(
        async (query: TQuery, version: number) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsPending(true);
            try {
                const result = await fetcherRef.current(query, controller.signal);
                if (versionRef.current === version) {
                    onResultRef.current(result);
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                throw e;
            } finally {
                if (versionRef.current === version) {
                    setIsPending(false);
                }
            }
        },
        delay,
    );

    const fn = useCallback(
        (query: TQuery) => {
            const version = ++versionRef.current;
            debouncedFn(query, version);
        },
        [debouncedFn],
    );

    const cancel = useCallback(() => {
        ++versionRef.current;
        abortRef.current?.abort();
        abortRef.current = null;
        cancelDebounce();
        setIsPending(false);
    }, [cancelDebounce]);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    return { fn, cancel, isPending };
}
