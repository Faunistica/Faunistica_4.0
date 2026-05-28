import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm, FormProvider, type UseFormReturn } from 'react-hook-form';
import { useCoordinateInputs } from './useCoordinateInputs';
import type { FormRecord } from '@/types/api.dto';

function createWrapper() {
    const formRef: { current: UseFormReturn<FormRecord> | null } = { current: null };
    const wrapper = ({ children }: { children: React.ReactNode }) => {
        const methods = useForm<FormRecord>({
            defaultValues: { latitude: 0, longitude: 0, verbatimcoordinates: '' },
        });
        formRef.current = methods;
        return <FormProvider {...methods}>{children}</FormProvider>;
    };
    return { wrapper, formRef };
}

describe('useCoordinateInputs — DM mode', () => {
    it('converts DM values to DD and writes to form after debounce', async () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('', 'dm'), { wrapper });

        act(() => {
            result.current.setLatDeg(50);
            result.current.setLatMin(30);
            result.current.setLonDeg(30);
            result.current.setLonMin(15);
        });

        await vi.waitFor(
            () => {
                expect(formRef.current!.getValues('latitude')).toBe(50.5);
            },
            { timeout: 500 },
        );

        expect(formRef.current!.getValues('longitude')).toBe(30.25);
        expect(formRef.current!.getValues('verbatimcoordinates')).toBe("50° 30' N, 30° 15' E");
    });

    it('does not write when any field is empty', async () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('', 'dm'), { wrapper });

        act(() => {
            result.current.setLatDeg(50);
            result.current.setLatMin(30);
        });

        await new Promise((r) => setTimeout(r, 400));

        expect(formRef.current!.getValues('latitude')).toBe(0);
    });

    it('negates latitude for S direction', async () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('', 'dm'), { wrapper });

        act(() => {
            result.current.setLatDeg(50);
            result.current.setLatMin(30);
            result.current.setLatDir('S');
            result.current.setLonDeg(30);
            result.current.setLonMin(15);
        });

        await vi.waitFor(
            () => {
                expect(formRef.current!.getValues('latitude')).toBe(-50.5);
            },
            { timeout: 500 },
        );
    });

    it('negates longitude for W direction', async () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('', 'dm'), { wrapper });

        act(() => {
            result.current.setLatDeg(50);
            result.current.setLatMin(30);
            result.current.setLonDeg(30);
            result.current.setLonMin(15);
            result.current.setLonDir('W');
        });

        await vi.waitFor(
            () => {
                expect(formRef.current!.getValues('longitude')).toBe(-30.25);
            },
            { timeout: 500 },
        );
    });
});

describe('useCoordinateInputs — DMS mode', () => {
    it('converts DMS values to DD and writes to form', async () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('', 'dms'), { wrapper });

        act(() => {
            result.current.setLatDeg(50);
            result.current.setLatMin(30);
            result.current.setLatSec(36);
            result.current.setLonDeg(30);
            result.current.setLonMin(15);
            result.current.setLonSec(0);
        });

        await vi.waitFor(
            () => {
                expect(formRef.current!.getValues('latitude')).toBe(50.51);
            },
            { timeout: 500 },
        );

        expect(formRef.current!.getValues('longitude')).toBe(30.25);
        expect(formRef.current!.getValues('verbatimcoordinates')).toBe(
            "50° 30' 36'' N, 30° 15' 0'' E",
        );
    });

    it('does not write when any DMS field is empty', async () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('', 'dms'), { wrapper });

        act(() => {
            result.current.setLatDeg(50);
            result.current.setLatMin(30);
            result.current.setLonDeg(30);
            result.current.setLonMin(15);
            // latSec and lonSec left empty
        });

        await new Promise((r) => setTimeout(r, 400));

        expect(formRef.current!.getValues('latitude')).toBe(0);
    });
});
