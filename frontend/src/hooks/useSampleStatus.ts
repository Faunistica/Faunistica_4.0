// src/hooks/useSampleStatus.ts
import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import type { FormSchema } from '@/types/forms';
import { BLOCKING_FIELDS, type BlockingFieldName } from '@/types/forms';

export type SampleStatus = 'empty' | 'draft' | 'valid' | 'error';

export function useSampleStatus(index: number): SampleStatus {
    const { formState: { errors, touchedFields }, getValues } = useFormContext<FormSchema>();

    const sampleErrors = errors.samples?.[index] as Record<string, any> | undefined;
    const sampleTouched = touchedFields.samples?.[index] as Record<string, any> | undefined;
    const sampleValues = getValues(`samples.${index}`) as Partial<FormSchema['samples'][0]> | undefined;

    return useMemo(() => {
        // 🟡 Пустой образец — ничего не тронуто
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
    }, [sampleErrors, sampleTouched, sampleValues]);
}