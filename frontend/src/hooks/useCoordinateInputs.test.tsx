import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm, FormProvider, type UseFormReturn } from 'react-hook-form';
import { useCoordinateInputs } from './useCoordinateInputs';
import type { FormRecord } from '@/types/api.dto';

function createWrapper(defaults?: Partial<FormRecord>) {
    const formRef: { current: UseFormReturn<FormRecord> | null } = { current: null };
    const wrapper = ({ children }: { children: React.ReactNode }) => {
        const methods = useForm<FormRecord>({
            defaultValues: {
                latitude: 0,
                longitude: 0,
                verbatimcoordinates: '',
                ...defaults,
            },
        });
        formRef.current = methods;
        return <FormProvider {...methods}>{children}</FormProvider>;
    };
    return { wrapper, formRef };
}

describe('useCoordinateInputs — DM mode', () => {
    it('converts DM values to DD and writes to form', () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('dm'), { wrapper });

        act(() => {
            result.current.latitude.degrees.onChange(50);
            result.current.latitude.minutes.onChange(30);
            result.current.longitude.degrees.onChange(30);
            result.current.longitude.minutes.onChange(15);
        });

        expect(formRef.current!.getValues('latitude')).toBe(50.5);
        expect(formRef.current!.getValues('longitude')).toBe(30.25);
        expect(formRef.current!.getValues('verbatimcoordinates')).toBe("50° 30' N, 30° 15' E");
    });

    it('negates latitude for S direction', () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('dm'), { wrapper });

        act(() => {
            result.current.latitude.degrees.onChange(50);
            result.current.latitude.minutes.onChange(30);
            result.current.latitude.direction.onChange('S');
            result.current.longitude.degrees.onChange(30);
            result.current.longitude.minutes.onChange(15);
        });

        expect(formRef.current!.getValues('latitude')).toBe(-50.5);
    });

    it('negates longitude for W direction', () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('dm'), { wrapper });

        act(() => {
            result.current.latitude.degrees.onChange(50);
            result.current.latitude.minutes.onChange(30);
            result.current.longitude.degrees.onChange(30);
            result.current.longitude.minutes.onChange(15);
            result.current.longitude.direction.onChange('W');
        });

        expect(formRef.current!.getValues('longitude')).toBe(-30.25);
    });
});

describe('useCoordinateInputs — DMS mode', () => {
    it('converts DMS values to DD and writes to form', () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('dms'), { wrapper });

        act(() => {
            result.current.latitude.degrees.onChange(50);
            result.current.latitude.minutes.onChange(30);
            result.current.latitude.seconds.onChange(36);
            result.current.longitude.degrees.onChange(30);
            result.current.longitude.minutes.onChange(15);
            result.current.longitude.seconds.onChange(0);
        });

        expect(formRef.current!.getValues('latitude')).toBe(50.51);
        expect(formRef.current!.getValues('longitude')).toBe(30.25);
        expect(formRef.current!.getValues('verbatimcoordinates')).toBe(
            "50° 30' 36'' N, 30° 15' 0'' E",
        );
    });
});

describe('useCoordinateInputs — sync from form to local state', () => {
    it('initializes local state from existing form values on mount', () => {
        const { wrapper } = createWrapper({ latitude: 50.5, longitude: 30.25 });
        const { result } = renderHook(() => useCoordinateInputs('dm'), { wrapper });

        expect(result.current.latitude.degrees.value).toBe(50);
        expect(result.current.latitude.minutes.value).toBe(30);
        expect(result.current.longitude.degrees.value).toBe(30);
        expect(result.current.longitude.minutes.value).toBe(15);
    });

    it('updates DM local state when form values change externally', () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('dm'), { wrapper });

        act(() => {
            formRef.current!.setValue('latitude', 50.5);
            formRef.current!.setValue('longitude', 30.25);
        });

        expect(result.current.latitude.degrees.value).toBe(50);
        expect(result.current.latitude.minutes.value).toBe(30);
        expect(result.current.longitude.degrees.value).toBe(30);
        expect(result.current.longitude.minutes.value).toBe(15);
    });

    it('updates DMS local state when form values change externally', () => {
        const { wrapper, formRef } = createWrapper();
        const { result } = renderHook(() => useCoordinateInputs('dms'), { wrapper });

        act(() => {
            formRef.current!.setValue('latitude', 50.51);
            formRef.current!.setValue('longitude', 30.25);
        });

        expect(result.current.latitude.degrees.value).toBe(50);
        expect(result.current.latitude.minutes.value).toBe(30);
        expect(result.current.latitude.seconds.value).toBe(36);
        expect(result.current.longitude.degrees.value).toBe(30);
        expect(result.current.longitude.minutes.value).toBe(15);
    });
});
