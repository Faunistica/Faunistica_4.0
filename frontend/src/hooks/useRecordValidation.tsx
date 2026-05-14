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
    createServerRecord: (args: { publ_id: number; user_id: number }) => any;
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
    const { trigger, getValues } = methods;
    const { prepend } = fieldArray;

    const [isValidating, setIsValidating] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Map<number, string[]>>(new Map());

    // ── Мягкая блокировка при добавлении записи ──
    // FIX: prepend НЕ вызывается до полного завершения Promise.all.
    // FIX: «Исправить сейчас» использует BLOCKING_FIELDS[i] напрямую для скролла.
    const addRecord = useCallback(async () => {
        const prefix = `samples.${activeRecordIndex}`;

        // Проверяем только блокирующие поля текущей записи
        const results = await Promise.all(
            BLOCKING_FIELDS.map((field) => trigger(`${prefix}.${field}` as any)),
        );
        const hasErrors = results.some((r) => !r);

        if (hasErrors) {
            const invalidFields = BLOCKING_FIELDS
                .map((field, i) => ({ field, label: getFieldLabel(field), valid: results[i] }))
                .filter((f) => !f.valid);

            const missing = invalidFields.map((f) => f.label);

            toast.custom(
                (t) => (
                    <div className="bg-white p-4 rounded-lg shadow-lg border max-w-md">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900">Заполните обязательные поля</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    Перед созданием новой записи завершите текущую:
                                </p>
                                <ul className="mt-2 text-sm text-slate-700 space-y-1">
                                    {missing.map((field) => (
                                        <li key={field} className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            {field}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    // FIX: используем ключ поля напрямую для скролла
                                    const firstInvalidField = invalidFields[0]?.field;
                                    if (firstInvalidField) {
                                        const fieldName = `${prefix}.${firstInvalidField}`;
                                        const el =
                                            document.querySelector(`[name="${fieldName}"]`) ||
                                            document.querySelector(`[id="${fieldName}"]`) ||
                                            document.querySelector(
                                                `[name*="${firstInvalidField}"][aria-invalid="true"]`,
                                            );
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        (el as HTMLElement)?.focus();
                                    }
                                    toast.dismiss(t);
                                }}
                            >
                                Исправить сейчас
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    prepend({});
                                    setActiveRecordIndex(0);
                                    toast.dismiss(t);
                                    toast.info(
                                        'Новая запись создана. Не забудьте вернуться и заполнить предыдущую.',
                                        { duration: 4000 },
                                    );
                                }}
                            >
                                Всё равно создать
                            </Button>
                        </div>
                    </div>
                ),
                { duration: Infinity },
            );
            return;
        }

        // ✅ Всё ок — создаём на сервере
        try {
            const created = await createServerRecord({ publ_id, user_id }).unwrap();
            prepend({ record_ids: { base: created.id } });
            setActiveRecordIndex(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            toast.error('Не удалось создать запись на сервере');
        }
    }, [activeRecordIndex, prepend, trigger, createServerRecord, publ_id, user_id, setActiveRecordIndex]);

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
