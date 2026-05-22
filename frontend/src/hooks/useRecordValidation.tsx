// src/hooks/useRecordValidation.ts
//
// Вся логика валидации записей:
// — создание новой записи на сервере
// — массовая проверка всех записей («Проверить всё») через trigger()
// Вынесено из FormFilling для разгрузки страницы.

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';

import type { FormSchema } from '@/types/forms';
import { getFieldLabel } from '@/types/forms';

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

            // Полная перезапись — исключаем баг RHF с «залипанием» данных
            reset({
                ...currentValues,
                samples: [{ record_ids: { base: created.id } }, ...(currentValues.samples || [])],
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

        // trigger() без аргументов валидирует всю форму разом.
        // С mode:'onBlur' это НЕ вызывает повторных ререндеров при обычном вводе.
        const isValid = await trigger();

        const errorsMap = new Map<number, string[]>();

        if (!isValid) {
            // Читаем из внутреннего мутабельного объекта RHF сразу после trigger()
            const currentErrors = methods.control._formState.errors;

            if (Array.isArray(currentErrors.samples)) {
                currentErrors.samples.forEach((sampleErr: any, i: number) => {
                    if (sampleErr) {
                        const invalidLabels: string[] = [];
                        for (const key of Object.keys(sampleErr)) {
                            invalidLabels.push(getFieldLabel(key));
                        }
                        if (invalidLabels.length > 0) {
                            errorsMap.set(i, invalidLabels);
                        }
                    }
                });
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
    }, [trigger, methods.control]);

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
