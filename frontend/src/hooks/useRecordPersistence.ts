// src/hooks/useRecordPersistence.ts
//
// Вся логика сохранения / создания / удаления записей на сервере.
// Вынесено из FormFilling для разгрузки страницы.

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { UseFormReturn } from 'react-hook-form';

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
}

export function useRecordPersistence({
    publ_id,
    user_id,
    methods,
}: UseRecordPersistenceOptions) {
    const { setValue, getValues, trigger } = methods;

    const [createRecord] = useCreateRecordMutation();
    const [editRecord] = useEditRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    /**
     * Сохраняет одну или все записи на сервер.
     * Обрабатывает расщепление по quantity-полям (sex × life_stage).
     */
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

                    const baseData = draftToRecordData(sample, publ_id);
                    const newRecordIds: Record<string, string> = { ...sample.record_ids };

                    const filledQuantities = QUANTITY_FIELDS.filter((f) => {
                        const q = (sample as any)[f];
                        return q !== undefined && q !== null && q > 0;
                    });

                    if (filledQuantities.length === 0) {
                        // Нет quantity — сохраняем как base record
                        const existingIds = Object.values(newRecordIds);
                        if (existingIds.length > 0) {
                            await editRecord({
                                ...baseData,
                                record_id: existingIds[0],
                                user_id,
                            }).unwrap();
                            for (let j = 1; j < existingIds.length; j++) {
                                await deleteRecord({ record_id: existingIds[j], user_id }).unwrap();
                            }
                            for (const key in newRecordIds) delete newRecordIds[key];
                            newRecordIds['base'] = existingIds[0];
                        } else {
                            const created = await createRecord({ publ_id, user_id }).unwrap();
                            await editRecord({
                                ...baseData,
                                record_id: created.id,
                                user_id,
                            }).unwrap();
                            newRecordIds['base'] = created.id;
                        }
                    } else {
                        let baseIdToReuse = newRecordIds['base'];
                        if (baseIdToReuse) {
                            delete newRecordIds['base'];
                        }

                        for (const field of QUANTITY_FIELDS) {
                            const quantity = (sample as any)[field];
                            let existingId = sample.record_ids?.[field];

                            if (quantity !== undefined && quantity !== null && quantity > 0) {
                                const { sex, life_stage } = getSexAndLifestageFromField(field);
                                const recordData = { ...baseData, quantity, sex, life_stage };

                                if (!existingId && baseIdToReuse) {
                                    existingId = baseIdToReuse;
                                    baseIdToReuse = undefined;
                                }

                                if (existingId) {
                                    await editRecord({
                                        ...recordData,
                                        record_id: existingId,
                                        user_id,
                                    }).unwrap();
                                    newRecordIds[field] = existingId;
                                } else {
                                    const created = await createRecord({ publ_id, user_id }).unwrap();
                                    await editRecord({
                                        ...recordData,
                                        record_id: created.id,
                                        user_id,
                                    }).unwrap();
                                    newRecordIds[field] = created.id;
                                }
                            } else if (existingId) {
                                await deleteRecord({ record_id: existingId, user_id }).unwrap();
                                delete newRecordIds[field];
                            }
                        }

                        if (baseIdToReuse) {
                            await deleteRecord({ record_id: baseIdToReuse, user_id }).unwrap();
                        }
                    }

                    setValue(`samples.${i}.record_ids` as any, newRecordIds, {
                        shouldDirty: false,
                        shouldValidate: false,
                    });
                }
                if (isManual) toast.success('Данные успешно сохранены');
            } catch (error) {
                if (isManual) {
                    toast.error('Ошибка при сохранении данных');
                    // При ручной попытке — показываем ВСЕ ошибки
                    trigger();
                }
                throw error;
            }
        },
        [publ_id, user_id, createRecord, editRecord, deleteRecord, setValue, trigger],
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
            if (sample?.record_ids) {
                for (const record_id of Object.values(sample.record_ids) as string[]) {
                    await deleteRecord({ record_id, user_id });
                }
                toast.success('Запись удалена из базы данных');
            }
        },
        [getValues, deleteRecord, user_id],
    );

    return {
        handleSave,
        handleManualSave,
        deleteServerRecords,
        createRecord,
    };
}
