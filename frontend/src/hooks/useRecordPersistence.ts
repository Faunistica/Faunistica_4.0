// src/hooks/useRecordPersistence.ts
//
// Вся логика сохранения / создания / удаления записей на сервере.
// Вынесено из FormFilling для разгрузки страницы.

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';

import type { FormSchema } from '@/types/forms';
import { QUANTITY_FIELDS } from '@/types/forms';
import { getSexAndLifestageFromField, draftToRecordData } from '@/lib/recordUtils';
import {
    useCreateRecordMutation,
    useEditRecordMutation,
    useDeleteRecordMutation,
} from '@/api/recordAPI';

interface UseRecordPersistenceOptions {
    publ_id: number;
    user_id: number;
    methods: UseFormReturn<FormSchema>;
    fieldArray: UseFieldArrayReturn<FormSchema, 'samples'>;
}

export function useRecordPersistence({
    publ_id,
    user_id,
    methods,
    fieldArray,
}: UseRecordPersistenceOptions) {
    const { getValues, setValue, trigger } = methods;

    const [createRecord] = useCreateRecordMutation();
    const [editRecord] = useEditRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    const handleSave = useCallback(
        async (data: FormSchema, isManual: boolean, targetIndex?: number) => {
            try {
                const indicesToSave =
                    targetIndex !== undefined
                        ? [targetIndex]
                        : Array.from({ length: data.samples.length }, (_, i) => i);

                for (const i of indicesToSave) {
                    const sample = data.samples[i];
                    if (!sample) continue;

                    // draftToRecordData уже правильно упаковывает количественные поля в массив specimens
                    const payload = draftToRecordData(sample);
                    const baseId = sample.record_ids?.base;

                    if (baseId) {
                        // Обновляем единственную запись (сервер сам разберется с массивом specimens)
                        await editRecord({
                            record_id: baseId,
                            data: payload,
                        }).unwrap();
                    } else {
                        // Создаем новую запись, если её еще нет (хотя обычно она создается при добавлении карточки)
                        const created = await createRecord({ publ_id }).unwrap();
                        await editRecord({
                            record_id: created.id,
                            data: payload,
                        }).unwrap();

                        setValue(
                            `samples.${i}.record_ids` as any,
                            { base: created.id },
                            {
                                shouldDirty: false,
                                shouldValidate: false,
                            },
                        );
                    }
                }
                if (isManual) toast.success('Данные успешно сохранены');
            } catch (error) {
                if (isManual) {
                    toast.error('Ошибка при сохранении данных');
                    trigger();
                }
                throw error;
            }
        },
        [publ_id, createRecord, editRecord, setValue, trigger],
    );

    /** Ручное сохранение (кнопка «Сохранить всё»). */
    const handleManualSave = useCallback(async () => {
        try {
            await handleSave(getValues(), true);
        } catch (error) {
            console.error(error);
        }
    }, [handleSave, getValues]);

    /** Удаление серверных записей, связанных с drafts[index]. */
    const deleteServerRecords = useCallback(
        async (index: number) => {
            const sample = getValues(`samples.${index}`) as any;
            if (sample?.record_ids?.base) {
                await deleteRecord({ record_id: sample.record_ids.base });
                toast.success('Запись удалена из базы данных');
            }
        },
        [getValues, deleteRecord],
    );

    return {
        handleSave,
        handleManualSave,
        deleteServerRecords,
        createRecord,
    };
}
