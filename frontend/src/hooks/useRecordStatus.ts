import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormRecord, RecordFull } from '@/types/api.dto';
import { BLOCKING_FIELDS } from '@/types/forms';

export type RecordStatus = 'empty' | 'draft' | 'valid' | 'error';

const SERVER_STATUS_MAP: Record<string, RecordStatus> = {
    rec_ok: 'valid',
    check_ok: 'valid',
    rec_fail: 'error',
    check_fail: 'error',
    rec_del: 'error',
};

function computeFromFormValues(values: Partial<FormRecord>): RecordStatus {
    const hasAnyValue = BLOCKING_FIELDS.some((field) => {
        const val = values[field as keyof FormRecord];
        return val !== undefined && val !== null && val !== '';
    });

    if (!hasAnyValue) {
        return 'empty';
    }

    const allBlockingFilled = BLOCKING_FIELDS.every((field) => {
        const val = values[field as keyof FormRecord];
        return val !== undefined && val !== null && val !== '';
    });

    if (allBlockingFilled) return 'valid';

    return 'draft';
}

export function useRecordStatus(
    _recordId: string,
    isActive: boolean,
    record?: RecordFull,
    methods?: UseFormReturn<FormRecord>,
): RecordStatus {
    return useMemo(() => {
        if (isActive && methods) {
            const values = methods.getValues();
            const hasErrors = Object.keys(methods.formState.errors).length > 0;

            if (hasErrors) return 'error';

            return computeFromFormValues(values);
        }

        if (!isActive && record) {
            const serverType = record.type;
            if (serverType && SERVER_STATUS_MAP[serverType]) {
                return SERVER_STATUS_MAP[serverType];
            }

            return computeFromFormValues(record);
        }

        return 'draft';
    }, [isActive, record, methods]);
}
