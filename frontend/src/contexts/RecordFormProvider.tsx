import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { UseFormReturn } from 'react-hook-form';
import type { FormRecord, RecordFull } from '@/types/api.dto';
import { draftToRecordData, toFormPartial } from '@/lib/recordUtils';
import { FORM_DEFAULT_VALUES } from '@/types/forms';
import { syncServerErrors } from '@/lib/syncServerErrors';
import {
    recordAPI,
    useRecordsListQuery,
    useRecordByIdQuery,
    useCreateRecordMutation,
    useEditRecordMutation,
    useSubmitRecordMutation,
    useDeleteRecordMutation,
    selectRecordIds,
} from '@/api/recordAPI';
import { skipToken } from '@reduxjs/toolkit/query';
import { useAppDispatch } from '@/store/store';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useNavigate, useParams } from 'react-router';
import { ActionsContext, PublIdContext } from './useRecordFormContext';
import { createFormStore, StoreContext } from './recordFormStore';

export const AUTO_SAVE_DELAY = 2000;
const SHOULD_AUTO_SAVE = import.meta.env.VITE_DISABLE_AUTO_SAVE;

export type RecordFormPhase =
    | { phase: 'idle' }
    | { phase: 'saving'; source: 'manual' | 'submit' | 'auto' }
    | { phase: 'syncing' }
    | { phase: 'error'; message: string };

export interface RecordFormActions {
    save: () => Promise<void>;
    submit: () => Promise<void>;
    switchTo: (targetId: string) => void;
    create: () => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
}

interface RecordFormProviderProps {
    publ_id: number;
    methods: UseFormReturn<FormRecord>;
    autoSaveDelay?: number;
    children: ReactNode;
}

export { ActionsContext, PublIdContext, useRecordFormActions } from './useRecordFormContext';
export { useFormSelector } from './useFormSelector';

export function RecordFormProvider({
    publ_id,
    methods,
    autoSaveDelay = AUTO_SAVE_DELAY,
    children,
}: RecordFormProviderProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const params = useParams();
    const [initialRecordLoaded, setInitialRecordLoaded] = useState(false);

    const storeRef = useRef<ReturnType<typeof createFormStore> | null>(null);
    if (!storeRef.current) storeRef.current = createFormStore();
    const store = storeRef.current;

    const { recordIds } = useRecordsListQuery(
        { publ_id },
        {
            selectFromResult: ({ data }) => ({
                recordIds: selectRecordIds({ data }),
            }),
        },
    );

    const explicitRecordId = params.record;
    const activeRecordId = explicitRecordId ?? recordIds[0] ?? null;

    const methodsRef = useRef(methods);

    const { isLoading: isListLoading } = useRecordsListQuery({ publ_id }, { skip: !publ_id });

    const { currentData: activeRecord } = useRecordByIdQuery(
        activeRecordId ? { record_id: activeRecordId } : skipToken,
        { refetchOnMountOrArgChange: true },
    );

    const [createRecord] = useCreateRecordMutation();
    const [editRecord] = useEditRecordMutation();
    const [submitRecord] = useSubmitRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    // Sync activeRecordId + isInitialLoading to store
    const isInitialLoading = isListLoading || (activeRecordId !== null && !initialRecordLoaded);
    const prevActiveId = store.getState().activeRecordId;
    const prevLoading = store.getState().isInitialLoading;
    if (prevActiveId !== activeRecordId || prevLoading !== isInitialLoading) {
        store.setState({ activeRecordId, isInitialLoading });
    }

    const shouldSkipSync = useCallback(
        (updatedAt: string): boolean => {
            const known = store.getKnownRef();
            if (!known) return false;
            return known.id === activeRecordId && known.updatedAt === updatedAt;
        },
        [activeRecordId, store],
    );

    const { fn: debouncedAutoSave, cancel: cancelPendingAutoSave } = useDebouncedCallback(
        async () => {
            const id = store.getState().activeRecordId;
            if (!id) return;

            const currentValues = methods.getValues();
            const currentSnapshot = JSON.stringify(currentValues);
            if (currentSnapshot === store.getSnapshotRef()) return;

            store.setState({ status: { phase: 'saving', source: 'auto' } });
            try {
                const payload = draftToRecordData(currentValues);
                const response = await editRecord({
                    record_id: id,
                    data: payload,
                    publ_id,
                }).unwrap();
                store.setKnownRef({
                    id,
                    updatedAt: response.updated_at,
                });
                store.setState({ lastSavedTime: new Date(), status: { phase: 'idle' } });
                store.setSnapshotRef(currentSnapshot);
            } catch {
                store.setState({ status: { phase: 'idle' } });
            }
        },
        autoSaveDelay,
    );

    useEffect(() => {
        methodsRef.current = methods;
    });

    useEffect(() => {
        if (!activeRecord) return;

        if (shouldSkipSync(activeRecord.updated_at)) {
            if (store.getPendingSync()) {
                store.setPendingSync(false);
                store.setState({ status: { phase: 'idle' } });
            }
            if (!initialRecordLoaded) {
                // oxlint-disable-next-line react-hooks-js/set-state-in-effect
                setInitialRecordLoaded(true);
                void navigate(`/publication/${publ_id}/${activeRecord.id}`, { replace: true });
            }
            return;
        }

        const m = methodsRef.current;
        m.reset(toFormPartial(activeRecord), {
            keepValues: false,
            keepErrors: false,
            keepTouched: false,
            keepDirty: false,
        });
        const nonField = syncServerErrors(activeRecord.errors ?? [], m);
        store.setState({ nonFieldErrors: nonField });

        store.setSnapshotRef(JSON.stringify(toFormPartial(activeRecord)));

        if (!initialRecordLoaded) {
            // oxlint-disable-next-line react-hooks-js/set-state-in-effect
            setInitialRecordLoaded(true);
            void navigate(`/publication/${publ_id}/${activeRecord.id}`, { replace: true });
        }

        if (store.getPendingSync()) {
            store.setPendingSync(false);
            store.setState({ status: { phase: 'idle' } });
        }
    }, [activeRecord, shouldSkipSync, initialRecordLoaded, navigate, publ_id, store]);

    useEffect(() => {
        if (!SHOULD_AUTO_SAVE) return () => {};

        const subscription = methods.watch(() => {
            if (store.getState().status.phase === 'saving') return;

            debouncedAutoSave();
        });

        return () => {
            subscription.unsubscribe();
            cancelPendingAutoSave();
        };
    }, [methods, debouncedAutoSave, cancelPendingAutoSave, store]);

    const performSave = useCallback(
        async (
            source: 'manual' | 'submit',
            values: Partial<FormRecord>,
        ): Promise<RecordFull | undefined> => {
            const id = store.getState().activeRecordId;
            if (!id) return undefined;

            try {
                const payload = draftToRecordData(values);
                const response = await editRecord({
                    record_id: id,
                    data: payload,
                    publ_id,
                }).unwrap();
                if (store.getState().activeRecordId === id) {
                    store.setKnownRef({
                        id,
                        updatedAt: response.updated_at,
                    });
                }
                return response;
            } catch {
                toast.error(
                    source === 'submit'
                        ? 'Ошибка при отправке данных'
                        : 'Ошибка при сохранении данных',
                );
                return undefined;
            }
        },
        [editRecord, publ_id, store],
    );

    const save = useCallback(async () => {
        cancelPendingAutoSave();
        if (store.getState().status.phase === 'saving' || store.getState().status.phase === 'syncing')
            return;

        store.setState({ status: { phase: 'saving', source: 'manual' } });
        const values = methodsRef.current.getValues();
        const response = await performSave('manual', values);
        if (response) {
            store.setState({ lastSavedTime: new Date() });
            const nonField = syncServerErrors(response.errors ?? [], methodsRef.current);
            store.setState({ nonFieldErrors: nonField });
        }
        store.setState({ status: { phase: 'idle' } });
    }, [cancelPendingAutoSave, performSave, store]);

    const submit = useCallback(async () => {
        cancelPendingAutoSave();
        const s = store.getState().status;
        if (s.phase === 'saving' || s.phase === 'syncing') return;

        const id = store.getState().activeRecordId;
        if (!id) return;

        store.setState({ status: { phase: 'saving', source: 'submit' } });
        try {
            const values = methodsRef.current.getValues();
            const payload = draftToRecordData(values);
            await editRecord({
                record_id: id,
                data: payload,
                publ_id,
            }).unwrap();
            const response = await submitRecord({
                record_id: id,
                data: payload,
            }).unwrap();
            store.setKnownRef({
                id,
                updatedAt: response.updated_at,
            });
            store.setState({ lastSavedTime: new Date() });
            const nonField = syncServerErrors(response.errors ?? [], methodsRef.current);
            store.setState({ nonFieldErrors: nonField });
            store.setState({ status: { phase: 'idle' } });
        } catch {
            store.setState({ status: { phase: 'idle' } });
        }
    }, [cancelPendingAutoSave, editRecord, submitRecord, publ_id, store]);

    const switchTo = useCallback(
        (targetId: string) => {
            if (targetId === store.getState().activeRecordId) return;

            cancelPendingAutoSave();
            store.setKnownRef(null);

            if (store.getState().activeRecordId) {
                store.setState({ status: { phase: 'saving', source: 'manual' } });
                void performSave('manual', methodsRef.current.getValues());
            }

            store.setPendingSync(true);
            void navigate(`/publication/${publ_id}/${targetId}`, { replace: true });
            store.setState({
                status: { phase: 'syncing' },
                lastSavedTime: null,
                nonFieldErrors: [],
            });
        },
        [cancelPendingAutoSave, performSave, navigate, publ_id, store],
    );

    const create = useCallback(async () => {
        try {
            cancelPendingAutoSave();

            if (store.getState().activeRecordId) {
                await performSave('manual', methodsRef.current.getValues());
            }

            const created = await createRecord({ publ_id }).unwrap();
            void dispatch(
                recordAPI.util.upsertQueryData('recordById', { record_id: created.id }, created),
            );

            store.setKnownRef({
                id: created.id,
                updatedAt: created.updated_at,
            });

            methodsRef.current.reset(FORM_DEFAULT_VALUES, {
                keepValues: false,
                keepErrors: false,
                keepTouched: false,
                keepDirty: false,
            });

            void navigate(`/publication/${publ_id}/${created.id}`, { replace: true });
            store.setState({ lastSavedTime: null, nonFieldErrors: [] });
        } catch {
            toast.error('Ошибка при создании записи');
        }
    }, [publ_id, createRecord, dispatch, cancelPendingAutoSave, performSave, navigate, store]);

    const deleteRecordAction = useCallback(
        async (id: string) => {
            const listArgs = { publ_id };
            const isActive = id === store.getState().activeRecordId;

            let nextId: string | null = null;
            if (isActive) {
                const remaining = recordIds.filter((rid) => rid !== id);
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
                    void navigate(`/publication/${publ_id}/${nextId}`, { replace: true });
                    if (nextId === null) {
                        setInitialRecordLoaded(false);
                    }
                }
            } catch {
                dispatch(recordAPI.util.invalidateTags(['records-list']));
                toast.error('Ошибка при удалении записи');
            }
        },
        [publ_id, dispatch, deleteRecord, recordIds, navigate, store],
    );

    const actions: RecordFormActions = useMemo(
        () => ({ save, submit, switchTo, create, deleteRecord: deleteRecordAction }),
        [save, submit, switchTo, create, deleteRecordAction],
    );

    return (
        <StoreContext.Provider value={store}>
            <ActionsContext.Provider value={actions}>
                <PublIdContext.Provider value={publ_id}>{children}</PublIdContext.Provider>
            </ActionsContext.Provider>
        </StoreContext.Provider>
    );
}
