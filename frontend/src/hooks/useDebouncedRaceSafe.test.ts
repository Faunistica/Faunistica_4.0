import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedRaceSafe } from './useDebouncedRaceSafe';

describe('useDebouncedRaceSafe', () => {
    it('debounces multiple rapid calls', async () => {
        const fetcher = vi.fn().mockResolvedValue('result');
        const onResult = vi.fn();
        const { result } = renderHook(() => useDebouncedRaceSafe(fetcher, onResult, 50));

        act(() => { result.current.fn('a'); });
        act(() => { result.current.fn('b'); });
        act(() => { result.current.fn('c'); });

        await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
        expect(onResult).toHaveBeenCalledWith('result');
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher).toHaveBeenCalledWith('c', expect.any(AbortSignal));
    });

    it('cancel prevents pending debounce from firing', async () => {
        const fetcher = vi.fn().mockResolvedValue('result');
        const onResult = vi.fn();
        const { result } = renderHook(() => useDebouncedRaceSafe(fetcher, onResult, 50));

        act(() => { result.current.fn('hello'); });
        act(() => { result.current.cancel(); });

        await new Promise((r) => setTimeout(r, 100));
        expect(fetcher).not.toHaveBeenCalled();
        expect(onResult).not.toHaveBeenCalled();
    });

    it('cancel aborts in-flight fetch and prevents onResult', async () => {
        const resolvers: Array<(v: string) => void> = [];
        const fetchPromise = new Promise<string>((resolve) => { resolvers.push(resolve); });
        const resolveFetch = resolvers[0];
        const fetcher = vi.fn().mockReturnValue(fetchPromise);
        const onResult = vi.fn();
        const { result } = renderHook(() => useDebouncedRaceSafe(fetcher, onResult, 10));

        act(() => { result.current.fn('query'); });
        await vi.waitFor(() => expect(fetcher).toHaveBeenCalled());

        act(() => { result.current.cancel(); });
        act(() => { resolveFetch('stale'); });

        await new Promise((r) => setTimeout(r, 10));
        expect(onResult).not.toHaveBeenCalled();
    });

    it('aborts previous in-flight fetch when new call executes', async () => {
        const abortSpy = vi.fn();
        const resolvers: Array<(v: string) => void> = [];
        const firstPromise = new Promise<string>((resolve) => { resolvers.push(resolve); });
        const resolveFirst = resolvers[0];
        const fetcher = vi.fn().mockImplementation(async (_query: string, signal: AbortSignal) => {
            signal.addEventListener('abort', abortSpy);
            if (_query === 'first') return firstPromise;
            return 'second-result';
        });
        const onResult = vi.fn();
        const { result } = renderHook(() => useDebouncedRaceSafe<string, string>(fetcher, onResult, 10));

        act(() => { result.current.fn('first'); });
        await vi.waitFor(() => expect(fetcher).toHaveBeenCalledWith('first', expect.any(AbortSignal)));

        act(() => { result.current.fn('second'); });
        await vi.waitFor(() => expect(fetcher).toHaveBeenCalledWith('second', expect.any(AbortSignal)));

        expect(abortSpy).toHaveBeenCalled();
        act(() => { resolveFirst('stale'); });
        await new Promise((r) => setTimeout(r, 10));
        expect(onResult).not.toHaveBeenCalledWith('stale');
    });

    it('isPending is true while fetch is in flight', async () => {
        const resolvers: Array<(v: string) => void> = [];
        const fetchPromise = new Promise<string>((resolve) => { resolvers.push(resolve); });
        const resolveFetch = resolvers[0];
        const fetcher = vi.fn().mockReturnValue(fetchPromise);
        const onResult = vi.fn();
        const { result } = renderHook(() => useDebouncedRaceSafe(fetcher, onResult, 10));

        expect(result.current.isPending).toBe(false);

        act(() => { result.current.fn('query'); });
        await vi.waitFor(() => expect(fetcher).toHaveBeenCalled());

        expect(result.current.isPending).toBe(true);

        act(() => { resolveFetch('done'); });
        await vi.waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it('passes AbortSignal to fetcher', async () => {
        const fetcher = vi.fn().mockResolvedValue('result');
        const onResult = vi.fn();
        const { result } = renderHook(() => useDebouncedRaceSafe(fetcher, onResult, 10));

        act(() => { result.current.fn('query'); });
        await vi.waitFor(() => expect(fetcher).toHaveBeenCalled());

        const signal = fetcher.mock.calls[0][1];
        expect(signal).toBeInstanceOf(AbortSignal);
        expect(signal.aborted).toBe(false);
    });

    it('returns a stable fn reference when deps stay the same', () => {
        const fetcher = vi.fn().mockResolvedValue('result');
        const onResult = vi.fn();
        const { result, rerender } = renderHook(() => useDebouncedRaceSafe(fetcher, onResult, 50));

        const firstFn = result.current.fn;
        rerender();
        expect(result.current.fn).toBe(firstFn);
    });

    it('only latest query result reaches onResult after rapid calls', async () => {
        const calls: string[] = [];
        const fetcher = vi.fn().mockImplementation(async (query: string) => {
            await new Promise((r) => setTimeout(r, 20));
            return query;
        });
        const onResult = vi.fn().mockImplementation((query: string) => { calls.push(query); });
        const { result } = renderHook(() => useDebouncedRaceSafe(fetcher, onResult, 10));

        act(() => { result.current.fn('first'); });
        act(() => { result.current.fn('second'); });
        act(() => { result.current.fn('third'); });

        await vi.waitFor(() => expect(calls).toEqual(['third']));
    });
});
