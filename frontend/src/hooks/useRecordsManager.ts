import { useState, useCallback, useRef, useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { toast } from 'sonner';
import {
    recordAPI,
    useRecordsListQuery,
    useCreateRecordMutation,
    useDeleteRecordMutation,
} from '@/api/recordAPI';
import { useAppDispatch, useAppSelector } from '@/store/store';

interface UseRecordsManagerReturn {
    activeRecordId: string | null;
    isLoading: boolean;
    recordMethods: {
        create: () => Promise<void>;
        switchTo: (targetId: string) => Promise<void>;
        delete: (id: string) => Promise<void>;
    };
    registerSave: (fn: (options?: { silent?: boolean }) => Promise<void>) => void;
}

export function useRecordsManager(publ_id: number): UseRecordsManagerReturn {
    const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
    const saveRef = useRef<((options?: { silent?: boolean }) => Promise<void>) | undefined>(
        undefined,
    );

    const { isLoading } = useRecordsListQuery({ publ_id }, { skip: !publ_id });

    const [createRecord] = useCreateRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();
    const dispatch = useAppDispatch();

    const activeIdRef = useRef(activeRecordId);

    useEffect(() => {
        activeIdRef.current = activeRecordId;
    });

    const recordIds = useAppSelector((state) => {
        const result = recordAPI.endpoints.recordsList.select({ publ_id })(state);
        const data = 'data' in result ? result.data : undefined;
        return data?.items?.map((r) => r.id) ?? [];
    }, shallowEqual);

    const recordIdsRef = useRef(recordIds);

    useEffect(() => {
        recordIdsRef.current = recordIds;
    });

    // oxlint-disable-next-line react-hooks-js/set-state-in-effect
    // OK: auto-select the first record when the list arrives; not a cascading render
    useEffect(() => {
        if (recordIds.length > 0 && activeRecordId === null) {
            setActiveRecordId(recordIds[0]);
        }
    }, [recordIds, activeRecordId]);

    const registerSave = useCallback((fn: (options?: { silent?: boolean }) => Promise<void>) => {
        saveRef.current = fn;
    }, []);

    const handleCreate = useCallback(async () => {
        const created = await createRecord({ publ_id }).unwrap();
        dispatch(
            recordAPI.util.upsertQueryData('recordById', { record_id: created.id }, created),
        ).catch(() => {});
        setActiveRecordId(created.id);
    }, [publ_id, createRecord, dispatch]);

    const switchToRecord = useCallback(async (targetId: string) => {
        if (targetId === activeIdRef.current) return;

        saveRef.current?.({ silent: true }).catch(() => {
            toast.error('Не удалось сохранить текущую запись');
        });

        setActiveRecordId(targetId);
    }, []);

    const handleDelete = useCallback(
        async (id: string) => {
            const listArgs = { publ_id };
            const isActive = id === activeIdRef.current;

            let nextId: string | null = null;
            if (isActive) {
                const remaining = recordIdsRef.current.filter((rid) => rid !== id);
                nextId = remaining[0] ?? null;
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
                    setActiveRecordId(nextId);
                }
            } catch {
                dispatch(recordAPI.util.invalidateTags(['records-list']));
                toast.error('Ошибка при удалении записи');
            }
        },
        [publ_id, dispatch, deleteRecord],
    );

    return {
        activeRecordId,
        isLoading,
        recordMethods: {
            create: handleCreate,
            switchTo: switchToRecord,
            delete: handleDelete,
        },
        registerSave,
    };
}
