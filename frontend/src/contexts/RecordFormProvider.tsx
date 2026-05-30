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
import {
    setState as storeSetState,
    getState,
    getLastKnown,
    getLastSnapshot,
    getPendingSync,
    setLastKnown,
    setLastSnapshot,
    setPendingSync,
} from './recordFormStore';

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
    const prevActiveId = getState().activeRecordId;
    const prevLoading = getState().isInitialLoading;
    if (prevActiveId !== activeRecordId || prevLoading !== isInitialLoading) {
        storeSetState({ activeRecordId, isInitialLoading });
    }

    const shouldSkipSync = useCallback(
        (updatedAt: string): boolean => {
            const known = getLastKnown();
            if (!known) return false;
            return known.id === activeRecordId && known.updatedAt === updatedAt;
        },
        [activeRecordId],
    );

    const { fn: debouncedAutoSave, cancel: cancelPendingAutoSave } = useDebouncedCallback(
        async () => {
            const id = getState().activeRecordId;
            if (!id) return;

            const currentValues = methods.getValues();
            const currentSnapshot = JSON.stringify(currentValues);
            if (currentSnapshot === getLastSnapshot()) return;

            storeSetState({ status: { phase: 'saving', source: 'auto' } });
            try {
                const payload = draftToRecordData(currentValues);
                const response = await editRecord({
                    record_id: id,
                    data: payload,
                    publ_id,
                }).unwrap();
                setLastKnown({
                    id,
                    updatedAt: response.updated_at,
                });
                storeSetState({ lastSavedTime: new Date(), status: { phase: 'idle' } });
                setLastSnapshot(currentSnapshot);
            } catch {
                storeSetState({ status: { phase: 'idle' } });
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
            if (getPendingSync()) {
                setPendingSync(false);
                storeSetState({ status: { phase: 'idle' } });
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
        storeSetState({ nonFieldErrors: nonField });

        setLastSnapshot(JSON.stringify(toFormPartial(activeRecord)));

        if (!initialRecordLoaded) {
            setInitialRecordLoaded(true);
            void navigate(`/publication/${publ_id}/${activeRecord.id}`, { replace: true });
        }

        if (getPendingSync()) {
            setPendingSync(false);
            storeSetState({ status: { phase: 'idle' } });
        }
    }, [activeRecord, shouldSkipSync, initialRecordLoaded, navigate, publ_id]);

    useEffect(() => {
        if (!SHOULD_AUTO_SAVE) return () => {};

        const subscription = methods.watch(() => {
            if (getState().status.phase === 'saving') return;

            debouncedAutoSave();
        });

        return () => {
            subscription.unsubscribe();
            cancelPendingAutoSave();
        };
    }, [methods, debouncedAutoSave, cancelPendingAutoSave]);

    const performSave = useCallback(
        async (
            source: 'manual' | 'submit',
            values: Partial<FormRecord>,
        ): Promise<RecordFull | undefined> => {
            const id = getState().activeRecordId;
            if (!id) return undefined;

            try {
                const payload = draftToRecordData(values);
                const response = await editRecord({
                    record_id: id,
                    data: payload,
                    publ_id,
                }).unwrap();
                if (getState().activeRecordId === id) {
                    setLastKnown({
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
        [editRecord, publ_id],
    );

    const save = useCallback(async () => {
        cancelPendingAutoSave();
        if (getState().status.phase === 'saving' || getState().status.phase === 'syncing') return;

        storeSetState({ status: { phase: 'saving', source: 'manual' } });
        const values = methodsRef.current.getValues();
        const response = await performSave('manual', values);
        if (response) {
            storeSetState({ lastSavedTime: new Date() });
            const nonField = syncServerErrors(response.errors ?? [], methodsRef.current);
            storeSetState({ nonFieldErrors: nonField });
        }
        storeSetState({ status: { phase: 'idle' } });
    }, [cancelPendingAutoSave, performSave]);

    const submit = useCallback(async () => {
        cancelPendingAutoSave();
        const s = getState().status;
        if (s.phase === 'saving' || s.phase === 'syncing') return;

        const id = getState().activeRecordId;
        if (!id) return;

        storeSetState({ status: { phase: 'saving', source: 'submit' } });
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
            setLastKnown({
                id,
                updatedAt: response.updated_at,
            });
            storeSetState({ lastSavedTime: new Date() });
            const nonField = syncServerErrors(response.errors ?? [], methodsRef.current);
            storeSetState({ nonFieldErrors: nonField });
            storeSetState({ status: { phase: 'idle' } });
        } catch {
            storeSetState({ status: { phase: 'idle' } });
        }
    }, [cancelPendingAutoSave, editRecord, submitRecord, publ_id]);

    const switchTo = useCallback(
        (targetId: string) => {
            if (targetId === getState().activeRecordId) return;

            cancelPendingAutoSave();
            setLastKnown(null);

            if (getState().activeRecordId) {
                storeSetState({ status: { phase: 'saving', source: 'manual' } });
                void performSave('manual', methodsRef.current.getValues());
            }

            setPendingSync(true);
            void navigate(`/publication/${publ_id}/${targetId}`, { replace: true });
            storeSetState({
                status: { phase: 'syncing' },
                lastSavedTime: null,
                nonFieldErrors: [],
            });
        },
        [cancelPendingAutoSave, performSave, navigate, publ_id],
    );

    const create = useCallback(async () => {
        try {
            cancelPendingAutoSave();

            if (getState().activeRecordId) {
                await performSave('manual', methodsRef.current.getValues());
            }

            const created = await createRecord({ publ_id }).unwrap();
            void dispatch(
                recordAPI.util.upsertQueryData('recordById', { record_id: created.id }, created),
            );

            setLastKnown({
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
            storeSetState({ lastSavedTime: null, nonFieldErrors: [] });
        } catch {
            toast.error('Ошибка при создании записи');
        }
    }, [publ_id, createRecord, dispatch, cancelPendingAutoSave, performSave, navigate]);

    const deleteRecordAction = useCallback(
        async (id: string) => {
            const listArgs = { publ_id };
            const isActive = id === getState().activeRecordId;

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
        [publ_id, dispatch, deleteRecord, recordIds, navigate],
    );

    const actions: RecordFormActions = useMemo(
        () => ({ save, submit, switchTo, create, deleteRecord: deleteRecordAction }),
        [save, submit, switchTo, create, deleteRecordAction],
    );

    return (
        <ActionsContext.Provider value={actions}>
            <PublIdContext.Provider value={publ_id}>{children}</PublIdContext.Provider>
        </ActionsContext.Provider>
    );
}
