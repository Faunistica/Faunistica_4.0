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
    validationErrors?: Map<number, string[]>,
): RecordStatus {
    const { formState: { errors, touchedFields }, getValues } = useFormContext<FormSchema>();

    const sampleErrors = errors.samples?.[index] as Record<string, any> | undefined;
    const sampleTouched = touchedFields.samples?.[index] as Record<string, any> | undefined;
    const sampleValues = getValues(`samples.${index}`) as Partial<FormSchema['samples'][0]> | undefined;

    return useMemo(() => {
        // If mass-validation found errors for this record — always show error
        if (validationErrors?.has(index) && (validationErrors.get(index)?.length ?? 0) > 0) {
            return 'error';
        }

        // 🟡 Пустая запись — ничего не тронуто
        if (!sampleTouched || Object.keys(sampleTouched).length === 0) {
            return 'empty';
        }

        // 🔴 Есть ошибки в блокирующих полях
        const hasBlockingError = BLOCKING_FIELDS.some(
            (field: BlockingFieldName) => sampleErrors?.[field] !== undefined
        );
        if (hasBlockingError) return 'error';

        // 🟢 Все блокирующие поля тронуты и не имеют ошибок
        const allBlockingTouched = BLOCKING_FIELDS.every(
            (field: BlockingFieldName) => sampleTouched?.[field] === true
        );
        if (allBlockingTouched) return 'valid';

        // 🔵 В процессе заполнения
        return 'draft';
    }, [sampleErrors, sampleTouched, sampleValues, validationErrors, index]);
}
