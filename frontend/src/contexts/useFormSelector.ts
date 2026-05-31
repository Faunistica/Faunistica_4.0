import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useFormStore, type FormStoreState } from './recordFormStore';

export function useFormSelector<T>(
    selector: (state: FormStoreState) => T,
    equalityFn: (a: T, b: T) => boolean = Object.is,
): T {
    const store = useFormStore();
    const prevRef = useRef<T | undefined>(undefined);
    const selectorRef = useRef(selector);
    const equalityFnRef = useRef(equalityFn);

    useEffect(() => {
        selectorRef.current = selector;
        equalityFnRef.current = equalityFn;
    });

    const getSnapshot = useCallback(() => {
        const next = selectorRef.current(store.getState());
        if (prevRef.current !== undefined && equalityFnRef.current(prevRef.current, next)) {
            return prevRef.current;
        }
        prevRef.current = next;
        return next;
    }, [store]);

    return useSyncExternalStore(store.subscribe, getSnapshot);
}
