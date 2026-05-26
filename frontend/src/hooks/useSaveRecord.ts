import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { FormRecord, UpdateRecordResponse } from '@/types/api.dto';
import { draftToRecordData } from '@/lib/recordUtils';
import { useEditRecordMutation, useSubmitRecordMutation } from '@/api/recordAPI';

interface UseSaveRecordReturn {
    save: (data: Partial<FormRecord>) => Promise<UpdateRecordResponse | undefined>;
    submit: (data: Partial<FormRecord>) => Promise<UpdateRecordResponse | undefined>;
    isSaving: boolean;
    isSavingRef: React.MutableRefObject<boolean>;
    shouldSkipSync: (updatedAt: string) => boolean;
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
    const lastSavedAtRef = useRef<string | null>(null);

    useEffect(() => {
        isSavingRef.current = isSaving;
    }, [isSaving]);

    const shouldSkipSync = useCallback((updatedAt: string): boolean => {
        return updatedAt === lastSavedAtRef.current;
    }, []);

    const save = useCallback(
        async (data: Partial<FormRecord>): Promise<UpdateRecordResponse | undefined> => {
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
                lastSavedAtRef.current = response.record.updated_at;
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
        async (data: Partial<FormRecord>): Promise<UpdateRecordResponse | undefined> => {
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
                lastSavedAtRef.current = response.record.updated_at;
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

    return { save, submit, isSaving, isSavingRef, shouldSkipSync };
}
