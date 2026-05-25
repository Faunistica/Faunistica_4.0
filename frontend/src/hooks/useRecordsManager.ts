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
    const recordsRef = useRef<RecordFull[]>([]);

    const { data: recordsData, isLoading } = useRecordsListQuery(
        { publ_id, user_id },
        { skip: !user_id || !publ_id },
    );

    const [createRecord] = useCreateRecordMutation();
    const [fetchRecordById] = useLazyRecordByIdQuery();
    const [deleteRecord] = useDeleteRecordMutation();
    const dispatch = useAppDispatch();

    const records = useMemo(() => {
        const items = recordsData?.items ?? [];
        recordsRef.current = items;
        return items;
    }, [recordsData]);

    useEffect(() => {
        if (recordsData?.items && !hasLoadedInitial) {
            const items = recordsData.items;
            if (items.length > 0) {
                setActiveRecord(items[0]);
            }
            setHasLoadedInitial(true);
        }
    }, [recordsData?.items, hasLoadedInitial]);

    // oxlint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!hasLoadedInitial || !recordsData) return;
        if (recordsData.items.length === 0) {
            if (activeRecord !== null) setActiveRecord(null);
            return;
        }
        if (activeRecord && !recordsData.items.some((r) => r.id === activeRecord.id)) {
            setActiveRecord(recordsData.items[0]);
        }
    }, [recordsData?.items, hasLoadedInitial, activeRecord?.id]);

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

            const cached = recordsRef.current.find((r) => r.id === targetId);
            if (cached) {
                setActiveRecord(cached);
            } else {
                const result = await fetchRecordById({ record_id: targetId }, false);
                if (result.data) {
                    setActiveRecord(result.data);
                }
            }
        },
        [activeRecord?.id, fetchRecordById],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            const snapshot = recordsData;
            const listArgs = { publ_id, user_id };
            const isActive = id === activeRecord?.id;

            let nextRecord: RecordFull | null = null;
            if (isActive) {
                const currentIdx = recordsRef.current.findIndex((r) => r.id === id);
                const remaining = recordsRef.current.filter((r) => r.id !== id);
                nextRecord = remaining[currentIdx] ?? remaining[currentIdx - 1] ?? null;
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
                if (snapshot) {
                    dispatch(
                        recordAPI.util.updateQueryData('recordsList', listArgs, (draft) => {
                            draft.items = snapshot.items;
                            draft.total = snapshot.total;
                        }),
                    );
                }
                toast.error('Ошибка при удалении записи');
            }
        },
        [activeRecord?.id, recordsData, publ_id, user_id, dispatch, deleteRecord],
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
