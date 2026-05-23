import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebouncedCallback } from './useDebounce';

describe('useDebouncedCallback', () => {
    it('returns a stable reference when callback changes but delay stays the same', () => {
        const fn = vi.fn();
        const { result, rerender } = renderHook(
            ({ cb }) => useDebouncedCallback(cb, 300),
            { initialProps: { cb: fn } },
        );

        const first = result.current;

        rerender({ cb: vi.fn() });

        expect(result.current).toBe(first);
    });

    it('calls the latest callback when invoked', async () => {
        const fn = vi.fn();
        const { result } = renderHook(
            ({ cb }) => useDebouncedCallback(cb, 10),
            { initialProps: { cb: fn } },
        );

        result.current('hello');
        await vi.waitFor(() => expect(fn).toHaveBeenCalledWith('hello'));
    });

    it('debounces multiple rapid calls', async () => {
        const fn = vi.fn();
        const { result } = renderHook(
            () => useDebouncedCallback(fn, 50),
        );

        result.current('a');
        result.current('b');
        result.current('c');

        await new Promise((r) => setTimeout(r, 100));
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('c');
    });
});
