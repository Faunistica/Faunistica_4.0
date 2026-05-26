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
        const { result } = renderHook(() => useSaveRecord('record-1'));

        await act(async () => {
            await result.current.save({ males: 3 });
        });

        expect(mockEditRecord).toHaveBeenCalledWith({
            record_id: 'record-1',
            data: expect.any(Object),
        });
    });

    it('calls editRecord then submitRecord on submit', async () => {
        const { result } = renderHook(() => useSaveRecord('record-1'));

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

    it('does nothing when activeRecordId is null', async () => {
        const { result } = renderHook(() => useSaveRecord(null));

        await act(async () => {
            await result.current.save({});
        });

        expect(mockEditRecord).not.toHaveBeenCalled();
    });
});
