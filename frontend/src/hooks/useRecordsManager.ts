import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { RecordFull } from '@/types/api.dto';
import {
    recordAPI,
    useRecordsListQuery,
    useLazyRecordByIdQuery,
    useCreateRecordMutation,
    useDeleteRecordMutation,
} from '@/api/recordAPI';
import { useAppDispatch } from '@/store/store';

interface UseRecordsManagerReturn {
    records: RecordFull[];
    activeRecord: RecordFull | null;
    isLoading: boolean;
    recordMethods: {
        create: () => Promise<void>;
        switchTo: (targetId: string) => Promise<void>;
        delete: (id: string) => Promise<void>;
    };
    registerSave: (fn: () => Promise<void>) => void;
}

export function useRecordsManager(publ_id: number, user_id: number): UseRecordsManagerReturn {
    const [activeRecord, setActiveRecord] = useState<RecordFull | null>(null);
    const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
    const saveRef = useRef<(() => Promise<void>) | undefined>(undefined);

    const { data: recordsData, isLoading } = useRecordsListQuery(
        { publ_id, user_id },
        { skip: !user_id || !publ_id },
    );

    const [createRecord] = useCreateRecordMutation();
    const [fetchRecordById] = useLazyRecordByIdQuery();
    const [deleteRecord] = useDeleteRecordMutation();
    const dispatch = useAppDispatch();

    const records = useMemo(() => recordsData?.items ?? [], [recordsData]);

    useEffect(() => {
        if (records.length > 0 && !hasLoadedInitial) {
            setActiveRecord(records[0]);
            setHasLoadedInitial(true);
        }
    }, [records, hasLoadedInitial]);

    const registerSave = useCallback((fn: () => Promise<void>) => {
        saveRef.current = fn;
    }, []);

    const handleCreate = useCallback(async () => {
        const created = await createRecord({ publ_id }).unwrap();
        setActiveRecord(created);
    }, [publ_id, createRecord]);

    const switchToRecord = useCallback(
        async (targetId: string) => {
            if (targetId === activeRecord?.id) return;

            try {
                await saveRef.current?.();
            } catch {
                // proceed with switch even if save fails
            }

            const result = await fetchRecordById({ record_id: targetId }, false);
            if (result.data) {
                setActiveRecord(result.data);
            }
        },
        [activeRecord?.id, fetchRecordById],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            const listArgs = { publ_id, user_id };
            const isActive = id === activeRecord?.id;

            let nextRecord: RecordFull | null = null;
            if (isActive) {
                nextRecord = records.filter((r) => r.id !== id)[0] ?? null;
            }

            dispatch(
                recordAPI.util.updateQueryData('recordsList', listArgs, (draft) => {
                    draft.items = draft.items.filter((item) => item.id !== id);
                    draft.total = Math.max(0, draft.total - 1);
                }),
            );

            try {
                await deleteRecord({ record_id: id }).unwrap();
                if (isActive) {
                    setActiveRecord(nextRecord);
                }
            } catch {
                if (records) {
                    dispatch(
                        recordAPI.util.updateQueryData('recordsList', listArgs, (draft) => {
                            draft.items = records;
                            draft.total = records.length;
                        }),
                    );
                }
                toast.error('Ошибка при удалении записи');
            }
        },
        [activeRecord?.id, records, publ_id, user_id, dispatch, deleteRecord],
    );

    return {
        records,
        activeRecord,
        isLoading,
        recordMethods: {
            create: handleCreate,
            switchTo: switchToRecord,
            delete: handleDelete,
        },
        registerSave,
    };
}
