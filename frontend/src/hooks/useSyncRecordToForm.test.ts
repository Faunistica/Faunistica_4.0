import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncRecordToForm } from './useSyncRecordToForm';

const createRecord = (id: string, updated_at: string) => ({
    id,
    updated_at,
    publ_id: 1,
    user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    errors: null,
    type: null,
    ip: null,
});

describe('useSyncRecordToForm', () => {
    it('does not call setFormValues when record is undefined', () => {
        const setFormValues = vi.fn();

        renderHook(() => useSyncRecordToForm(undefined, setFormValues));

        expect(setFormValues).not.toHaveBeenCalled();
    });

    it('calls setFormValues when a new record arrives', () => {
        const setFormValues = vi.fn();
        const record = createRecord('1', '2024-01-01T00:00:00Z');

        renderHook(() => useSyncRecordToForm(record, setFormValues));

        expect(setFormValues).toHaveBeenCalledTimes(1);
        expect(setFormValues).toHaveBeenCalledWith(record);
    });

    it('does not call setFormValues for the same record with same updated_at', () => {
        const setFormValues = vi.fn();
        const record = createRecord('1', '2024-01-01T00:00:00Z');

        const { rerender } = renderHook(({ r }) => useSyncRecordToForm(r, setFormValues), {
            initialProps: { r: record },
        });

        expect(setFormValues).toHaveBeenCalledTimes(1);

        rerender({ r: { ...record } });

        expect(setFormValues).toHaveBeenCalledTimes(1);
    });

    it('calls setFormValues for the same record when updated_at differs', () => {
        const setFormValues = vi.fn();
        const record1 = createRecord('1', '2024-01-01T00:00:00Z');
        const record2 = createRecord('1', '2024-01-02T00:00:00Z');

        const { rerender } = renderHook(({ r }) => useSyncRecordToForm(r, setFormValues), {
            initialProps: { r: record1 },
        });

        expect(setFormValues).toHaveBeenCalledTimes(1);

        rerender({ r: record2 });

        expect(setFormValues).toHaveBeenCalledTimes(2);
        expect(setFormValues).toHaveBeenCalledWith(record2);
    });

    it('calls setFormValues when switching to a different record', () => {
        const setFormValues = vi.fn();
        const recordA = createRecord('a', '2024-01-01T00:00:00Z');
        const recordB = createRecord('b', '2024-01-01T00:00:00Z');

        const { rerender } = renderHook(({ r }) => useSyncRecordToForm(r, setFormValues), {
            initialProps: { r: recordA },
        });

        expect(setFormValues).toHaveBeenCalledTimes(1);

        rerender({ r: recordB });

        expect(setFormValues).toHaveBeenCalledTimes(2);
        expect(setFormValues).toHaveBeenCalledWith(recordB);
    });

    it('handles A → B → A sequence correctly', () => {
        const setFormValues = vi.fn();
        const recordA = createRecord('a', '2024-01-01T00:00:00Z');
        const recordB = createRecord('b', '2024-01-01T00:00:00Z');

        const { rerender } = renderHook(({ r }) => useSyncRecordToForm(r, setFormValues), {
            initialProps: { r: recordA },
        });

        expect(setFormValues).toHaveBeenCalledTimes(1);

        rerender({ r: recordB });

        expect(setFormValues).toHaveBeenCalledTimes(2);

        rerender({ r: recordA });

        expect(setFormValues).toHaveBeenCalledTimes(3);
    });
});
