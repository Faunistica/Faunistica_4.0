import { useCallback, useRef, useSyncExternalStore } from 'react';
import { getState, subscribe, type FormStoreState } from './recordFormStore';

export function useFormSelector<T>(
    selector: (state: FormStoreState) => T,
    equalityFn: (a: T, b: T) => boolean = Object.is,
): T {
    const prevRef = useRef<T | undefined>(undefined);
    const selectorRef = useRef(selector);
    const equalityFnRef = useRef(equalityFn);

    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;

    const getSnapshot = useCallback(() => {
        const next = selectorRef.current(getState());
        if (prevRef.current !== undefined && equalityFnRef.current(prevRef.current, next)) {
            return prevRef.current;
        }
        prevRef.current = next;
        return next;
    }, []);

    return useSyncExternalStore(subscribe, getSnapshot);
}
