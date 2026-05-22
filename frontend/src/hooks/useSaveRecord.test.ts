/* oxlint-disable typescript/no-unsafe-type-assertion */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSaveRecord } from '@/hooks/useSaveRecord';

const mockEditRecord = vi.fn();
const mockSubmitRecord = vi.fn();

vi.mock('@/api/recordAPI', () => ({
    useEditRecordMutation: () => [mockEditRecord, { isLoading: false }],
    useSubmitRecordMutation: () => [mockSubmitRecord, { isLoading: false }],
}));

const createMockMethods = () => ({
    clearErrors: vi.fn(),
    setError: vi.fn(),
    getValues: vi.fn(() => ({})),
    watch: vi.fn(),
    reset: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    handleSubmit: vi.fn(),
    setValue: vi.fn(),
    trigger: vi.fn(),
    formState: { errors: {}, isDirty: false, isValid: true },
    control: {} as any,
});

describe('useSaveRecord', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEditRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ errors: [] }),
        });
        mockSubmitRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ errors: [] }),
        });
    });

    it('calls editRecord on save with correct args', async () => {
        const methods = createMockMethods();
        const { result } = renderHook(() => useSaveRecord('record-1', methods as any));

        await act(async () => {
            await result.current.save({ males: 3 });
        });

        expect(mockEditRecord).toHaveBeenCalledWith({
            record_id: 'record-1',
            data: expect.any(Object),
        });
    });

    it('calls editRecord then submitRecord on submit', async () => {
        const methods = createMockMethods();
        mockEditRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ errors: [] }),
        });
        mockSubmitRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ errors: [] }),
        });

        const { result } = renderHook(() => useSaveRecord('record-1', methods as any));

        await act(async () => {
            await result.current.submit({ males: 3 });
        });

        expect(mockEditRecord).toHaveBeenCalledWith({
            record_id: 'record-1',
            data: expect.any(Object),
        });
        expect(mockSubmitRecord).toHaveBeenCalledWith({
            record_id: 'record-1',
            data: expect.any(Object),
        });
    });

    it('maps field errors to setError', async () => {
        const methods = createMockMethods();
        mockEditRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({
                errors: [
                    { fields: ['country'], message: 'Обязательное поле', code: 'required' },
                    {
                        fields: ['family', 'genus'],
                        message: 'Заполните таксономию',
                        code: 'required',
                    },
                ],
            }),
        });

        const { result } = renderHook(() => useSaveRecord('record-1', methods as any));

        await act(async () => {
            await result.current.save({});
        });

        expect(methods.clearErrors).toHaveBeenCalled();
        expect(methods.setError).toHaveBeenCalledWith('country', {
            type: 'server',
            message: 'Обязательное поле',
        });
        expect(methods.setError).toHaveBeenCalledWith('family', {
            type: 'server',
            message: 'Заполните таксономию',
        });
        expect(methods.setError).toHaveBeenCalledWith('genus', {
            type: 'server',
            message: 'Заполните таксономию',
        });
    });

    it('collects non-field errors from response', async () => {
        const methods = createMockMethods();
        mockEditRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({
                errors: [
                    { fields: [], message: 'Server internal error', code: 'internal' },
                    { fields: [], message: 'Database timeout', code: 'timeout' },
                ],
            }),
        });

        const { result } = renderHook(() => useSaveRecord('record-1', methods as any));

        await act(async () => {
            await result.current.save({});
        });

        expect(result.current.nonFieldErrors).toEqual([
            'Server internal error',
            'Database timeout',
        ]);
    });

    it('clears previous errors before new mapping', async () => {
        const methods = createMockMethods();

        mockEditRecord
            .mockReturnValueOnce({
                unwrap: vi.fn().mockResolvedValue({
                    errors: [{ fields: ['species'], message: 'Required', code: 'required' }],
                }),
            })
            .mockReturnValueOnce({
                unwrap: vi.fn().mockResolvedValue({ errors: [] }),
            });

        const { result } = renderHook(() => useSaveRecord('record-1', methods as any));

        await act(async () => {
            await result.current.save({});
        });

        expect(methods.setError).toHaveBeenCalledWith('species', {
            type: 'server',
            message: 'Required',
        });

        methods.setError.mockClear();
        methods.clearErrors.mockClear();

        await act(async () => {
            await result.current.save({});
        });

        expect(methods.setError).not.toHaveBeenCalled();
    });

    it('does nothing when activeRecordId is null', async () => {
        const methods = createMockMethods();
        const { result } = renderHook(() => useSaveRecord(null, methods as any));

        await act(async () => {
            await result.current.save({});
        });

        expect(mockEditRecord).not.toHaveBeenCalled();
    });
});
