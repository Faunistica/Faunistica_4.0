// src/hooks/useRecordValidation.ts
//
// Вся логика валидации записей:
// — мягкая блокировка при добавлении новой записи (BLOCKING_FIELDS)
// — массовая проверка всех записей («Проверить всё»)
// Вынесено из FormFilling для разгрузки страницы.

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';

import type { FormSchema } from '@/types/forms';
import { BLOCKING_FIELDS, getFieldLabel } from '@/types/forms';
import { Button } from '@/components/ui/button';

interface UseRecordValidationOptions {
    methods: UseFormReturn<FormSchema>;
    fieldArray: UseFieldArrayReturn<FormSchema, 'samples'>;
    activeRecordIndex: number;
    setActiveRecordIndex: (index: number) => void;
    createServerRecord: (args: { publ_id: number }) => any;
    publ_id: number;
    user_id: number;
}

export function useRecordValidation({
    methods,
    fieldArray,
    activeRecordIndex,
    setActiveRecordIndex,
    createServerRecord,
    publ_id,
    user_id,
}: UseRecordValidationOptions) {
    const { trigger, getValues, reset } = methods;
    const { remove } = fieldArray;

    const [isValidating, setIsValidating] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Map<number, string[]>>(new Map());

    // ── Создание записи ──
    const addRecord = useCallback(async () => {
        try {
            const created = await createServerRecord({ publ_id }).unwrap();
            const currentValues = getValues();
            
            // Исключаем баг RHF с "залипанием" данных (shifting unmounted fields)
            // через полную перезапись состояния всей формы:
            reset({
                ...currentValues,
                samples: [
                    { record_ids: { base: created.id } },
                    ...(currentValues.samples || [])
                ]
            });
            
            setActiveRecordIndex(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            toast.error('Не удалось создать запись на сервере');
        }
    }, [getValues, reset, createServerRecord, publ_id, setActiveRecordIndex]);

    // ── Массовая проверка всех записей ──
    const handleValidateAll = useCallback(async () => {
        setIsValidating(true);
        const data = getValues();
        const errorsMap = new Map<number, string[]>();

        for (let i = 0; i < data.samples.length; i++) {
            const prefix = `samples.${i}`;
            const results = await Promise.all(
                BLOCKING_FIELDS.map((field) => trigger(`${prefix}.${field}` as any)),
            );

            const invalidLabels = BLOCKING_FIELDS
                .filter((_, fi) => !results[fi])
                .map((f) => getFieldLabel(f));

            if (invalidLabels.length > 0) {
                errorsMap.set(i, invalidLabels);
            }
        }

        setValidationErrors(errorsMap);
        setIsValidating(false);

        if (errorsMap.size > 0) {
            toast.error(
                `Найдено ошибок в ${errorsMap.size} ${errorsMap.size === 1 ? 'записи' : 'записях'}`,
                { duration: 5000 },
            );
        } else {
            toast.success('Все записи заполнены корректно!', { duration: 3000 });
        }
    }, [getValues, trigger]);

    /** Убрать ошибки для конкретного индекса (при удалении записи). */
    const clearValidationError = useCallback((index: number) => {
        setValidationErrors((prev) => {
            const next = new Map(prev);
            next.delete(index);
            return next;
        });
    }, []);

    /** Сбросить все ошибки валидации (при импорте). */
    const resetValidationErrors = useCallback(() => {
        setValidationErrors(new Map());
    }, []);

    return {
        addRecord,
        handleValidateAll,
        validationErrors,
        isValidating,
        clearValidationError,
        resetValidationErrors,
    };
}
