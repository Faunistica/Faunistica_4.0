import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebouncedCallback } from './useDebounce';

describe('useDebouncedCallback', () => {
    it('returns a stable reference when callback changes but delay stays the same', () => {
        const fn = vi.fn();
        const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 300), {
            initialProps: { cb: fn },
        });

        const firstFn = result.current.fn;

        rerender({ cb: vi.fn() });

        expect(result.current.fn).toBe(firstFn);
    });

    it('calls the latest callback when invoked', async () => {
        const fn = vi.fn();
        const { result } = renderHook(({ cb }) => useDebouncedCallback(cb, 10), {
            initialProps: { cb: fn },
        });

        result.current.fn('hello');
        await vi.waitFor(() => expect(fn).toHaveBeenCalledWith('hello'));
    });

    it('debounces multiple rapid calls', async () => {
        const fn = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(fn, 50));

        result.current.fn('a');
        result.current.fn('b');
        result.current.fn('c');

        await new Promise((r) => setTimeout(r, 100));
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('c');
    });

    it('cancel prevents pending call from firing', async () => {
        const fn = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(fn, 50));

        result.current.fn('should-not-fire');
        result.current.cancel();

        await new Promise((r) => setTimeout(r, 100));
        expect(fn).not.toHaveBeenCalled();
    });
});
