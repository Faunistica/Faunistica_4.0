// src/hooks/useRecordStatus.ts

import { useMemo } from 'react';
import { REQUIRED_FIELDS, type RequiredFieldName } from '@/types/forms';

export type RecordStatus = 'empty' | 'draft' | 'valid' | 'error';

/**
 * Determines the visual status of a single record in the sidebar.
 * Relies strictly on the backend `type` field, but overrides to 'empty'/'draft' 
 * if the record has not been filled out yet, so we don't annoy the user.
 */
export function useRecordStatus(
    index: number,
    sample: Record<string, any>,
    validationErrors?: Map<number, string[]>, // Left for backward compatibility, but won't be heavily used
    sampleErrors?: Record<string, any>,
): RecordStatus {
    return useMemo(() => {
        // If mass-validation found errors for this record — always show error
        if (validationErrors?.has(index) && (validationErrors.get(index)?.length ?? 0) > 0) {
            return 'error';
        }

        // 🟡 Check if record is completely empty (no required fields filled)
        const hasAnyValue = REQUIRED_FIELDS.some((field: RequiredFieldName) => {
            const val = sample?.[field];
            return val !== undefined && val !== null && val !== '';
        });

        if (!hasAnyValue) {
            return 'empty'; // Visually don't yell at the user for a fresh record
        }

        // Use API status directly for everything else
        if (sample?.type === 'rec_ok' || sample?.type === 'check_ok') {
            return 'valid';
        }
        if (sample?.type === 'rec_fail' || sample?.type === 'check_fail') {
            return 'error';
        }

        // 🔵 В процессе заполнения (fallback, если type ещё не проставлен с бэка)
        return 'draft';
    }, [sample?.type, validationErrors, index, sample]);
}

