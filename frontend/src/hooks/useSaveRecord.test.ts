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

function mockResponse(updatedAt = '2024-01-01T00:00:00Z') {
    return {
        record: {
            id: 'record-1',
            updated_at: updatedAt,
        },
        errors: [],
    };
}

function mockSubmitResponse(updatedAt = '2024-01-01T01:00:00Z') {
    return {
        record: {
            id: 'record-1',
            updated_at: updatedAt,
        },
        errors: [],
    };
}

describe('useSaveRecord', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEditRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(mockResponse()),
        });
        mockSubmitRecord.mockReturnValue({
            unwrap: vi.fn().mockResolvedValue(mockSubmitResponse()),
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

    it('shouldSkipSync returns false before any save', () => {
        const { result } = renderHook(() => useSaveRecord('record-1'));

        expect(result.current.shouldSkipSync('any-value')).toBe(false);
    });

    it('shouldSkipSync returns true for saved updated_at after save', async () => {
        const { result } = renderHook(() => useSaveRecord('record-1'));

        await act(async () => {
            await result.current.save({ males: 3 });
        });

        expect(result.current.shouldSkipSync('2024-01-01T00:00:00Z')).toBe(true);
    });

    it('shouldSkipSync returns false for different updated_at after save', async () => {
        const { result } = renderHook(() => useSaveRecord('record-1'));

        await act(async () => {
            await result.current.save({ males: 3 });
        });

        expect(result.current.shouldSkipSync('2025-01-01T00:00:00Z')).toBe(false);
    });

    it('shouldSkipSync returns true for submit response updated_at', async () => {
        const { result } = renderHook(() => useSaveRecord('record-1'));

        await act(async () => {
            await result.current.submit({ males: 3 });
        });

        expect(result.current.shouldSkipSync('2024-01-01T01:00:00Z')).toBe(true);
    });
});
