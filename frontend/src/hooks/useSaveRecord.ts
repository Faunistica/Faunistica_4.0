import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { FormRecord, UpdateRecordResponse } from '@/types/api.dto';
import { draftToRecordData } from '@/lib/recordUtils';
import { useEditRecordMutation, useSubmitRecordMutation } from '@/api/recordAPI';

interface UseSaveRecordReturn {
    save: (
        data: Partial<FormRecord>,
        options?: { silent?: boolean },
    ) => Promise<UpdateRecordResponse | undefined>;
    submit: (data: Partial<FormRecord>) => Promise<UpdateRecordResponse | undefined>;
    isSaving: boolean;
    isSavingRef: React.RefObject<boolean>;
}

export function useSaveRecord(
    activeRecordId: string | null,
    publ_id?: number,
    user_id?: number,
): UseSaveRecordReturn {
    const [editRecord] = useEditRecordMutation();
    const [submitRecord] = useSubmitRecordMutation();
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);

    useEffect(() => {
        isSavingRef.current = isSaving;
    }, [isSaving]);

    const save = useCallback(
        async (data: Partial<FormRecord>, _options?: { silent?: boolean }) => {
            if (!activeRecordId) return undefined;

            setIsSaving(true);
            try {
                const payload = draftToRecordData(data);
                const response = await editRecord({
                    record_id: activeRecordId,
                    data: payload,
                    publ_id,
                    user_id,
                }).unwrap();
                return response;
            } catch (error) {
                toast.error('Ошибка при сохранении данных');
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        [activeRecordId, editRecord, publ_id, user_id],
    );

    const submit = useCallback(
        async (data: Partial<FormRecord>) => {
            if (!activeRecordId) return undefined;

            setIsSaving(true);
            try {
                const payload = draftToRecordData(data);
                await editRecord({
                    record_id: activeRecordId,
                    data: payload,
                    publ_id,
                    user_id,
                }).unwrap();
                const response = await submitRecord({
                    record_id: activeRecordId,
                    data: payload,
                }).unwrap();
                return response;
            } catch (error) {
                toast.error('Ошибка при отправке данных');
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        [activeRecordId, editRecord, submitRecord, publ_id, user_id],
    );

    return { save, submit, isSaving, isSavingRef };
}
