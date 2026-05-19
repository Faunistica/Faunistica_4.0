// src/hooks/useRecordStatus.ts
import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import type { FormSchema } from '@/types/forms';
import { BLOCKING_FIELDS, type BlockingFieldName } from '@/types/forms';

export type RecordStatus = 'empty' | 'draft' | 'valid' | 'error';

/**
 * Determines the visual status of a single record in the sidebar.
 * Also accepts an external `validationErrors` map populated by the
 * "Проверить всё" mass-validation pass — these override local form state.
 */
export function useRecordStatus(
    index: number,
    sample: Record<string, any>,
    validationErrors?: Map<number, string[]>,
): RecordStatus {
    const {
        formState: { errors },
    } = useFormContext<FormSchema>();

    const sampleErrors = errors.samples?.[index] as Record<string, any> | undefined;

    return useMemo(() => {
        // If mass-validation found errors for this record — always show error
        if (validationErrors?.has(index) && (validationErrors.get(index)?.length ?? 0) > 0) {
            return 'error';
        }

        // 🟡 Пустая запись
        const hasAnyValue = BLOCKING_FIELDS.some((field: BlockingFieldName) => {
            const val = sample?.[field];
            return val !== undefined && val !== null && val !== '';
        });

        if (!hasAnyValue) {
            return 'empty';
        }

        // 🟢 Все блокирующие поля заполнены и не имеют ошибок
        const allBlockingFilled = BLOCKING_FIELDS.every((field: BlockingFieldName) => {
            const val = sample?.[field];
            return val !== undefined && val !== null && val !== '';
        });
        if (allBlockingFilled) return 'valid';

        // 🔵 В процессе заполнения
        return 'draft';
    }, [sampleErrors, sample, validationErrors, index]);
}
