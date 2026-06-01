import { type ReactNode, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { UseFormReturn } from 'react-hook-form';
import type { FormRecord, RecordFull } from '@/types/api.dto';
import { draftToRecordData, toFormPartial } from '@/lib/recordUtils';
import { FORM_DEFAULT_VALUES } from '@/types/forms';
import { syncServerErrors } from '@/lib/syncServerErrors';
import {
    useRecordsListQuery,
    useRecordByIdQuery,
    useCreateRecordMutation,
    useUpdateRecordMutation,
    useDeleteRecordMutation,
    selectRecordIds,
} from '@/api/recordAPI';
import { skipToken } from '@reduxjs/toolkit/query';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useNavigate, useParams } from 'react-router';
import { createFormStore, type FormStoreState, StoreContext } from './recordFormStore';
import { ActionsContext, PublIdContext } from './useRecordForm';
import type { SerializedError } from '@reduxjs/toolkit';
import type { TypedFetchBaseQueryError } from '@/api/baseQuery';

interface RecordFormProviderProps {
    publ_id: number;
    methods: UseFormReturn<FormRecord>;
    autoSaveDelay?: number;
    children: ReactNode;
}

export interface RecordFormActions {
    save: () => Promise<void>;
    submit: () => Promise<void>;
    onNavigate: (targetId: string) => void;
    create: () => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
}

export const AUTO_SAVE_DELAY = 2000;
const ENABLE_AUTO_SAVE = import.meta.env.VITE_DISABLE_AUTO_SAVE;

export function RecordFormProvider({
    publ_id,
    methods,
    autoSaveDelay = AUTO_SAVE_DELAY,
    children,
}: RecordFormProviderProps) {
    const navigate = useNavigate();
    const { record: recordParam } = useParams();

    const [initialRecordLoaded, setInitialRecordLoaded] = useState(false);
    const [store] = useState(() => createFormStore());

    const { recordIds, isListLoading } = useRecordsListQuery(
        {
            publ_id,
            pivot_record_id: recordParam && !initialRecordLoaded ? recordParam : undefined,
        },
        {
            selectFromResult: ({ data, isLoading }) => ({
                recordIds: selectRecordIds({ data }),
                isListLoading: isLoading,
            }),
        },
    );

    const activeRecordId = recordParam ?? recordIds[0] ?? null;
    const { currentData: activeRecord, error: getRecordError } = useRecordByIdQuery(
        activeRecordId ? { record_id: activeRecordId } : skipToken,
        { refetchOnMountOrArgChange: true },
    );

    const handleGetError = useEffectEvent(
        (error: SerializedError | TypedFetchBaseQueryError | undefined) => {
            if (error) {
                void navigate(`/publication/${publ_id}`, { replace: true });
            }
        },
    );

    useEffect(() => {
        handleGetError(getRecordError);
    }, [getRecordError]);

    const [createRecord] = useCreateRecordMutation();
    const [updateRecord] = useUpdateRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    const isInitialLoading = isListLoading || (activeRecordId !== null && !initialRecordLoaded);

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
                const response = await updateRecord({
                    submit: false,
                    record_id: id,
                    data: payload,
                    publ_id,
                }).unwrap();
                store.setKnownRef({
                    id,
                    updatedAt: response.updated_at,
                });
                store.setState({
                    lastSavedTime: new Date(),
                    status: { phase: 'idle', submitted: false },
                });
                store.setSnapshotRef(currentSnapshot);
            } catch {
                store.setState({ status: { phase: 'idle', submitted: false } });
            }
        },
        autoSaveDelay,
    );

    useEffect(() => {
        store.setState({ activeRecordId, isInitialLoading, recordIds });
    }, [activeRecordId, isInitialLoading, recordIds, store]);

    const finishInit = useEffectEvent((recordId: string) => {
        if (initialRecordLoaded) return;
        setInitialRecordLoaded(true);
        void navigate(`/publication/${publ_id}/${recordId}`, { replace: true });
    });

    const onSync = useEffectEvent((record: RecordFull) => {
        const newState: Partial<FormStoreState> = {
            status: {
                phase: 'idle',
                submitted: record.type === 'rec_ok' || record.type === 'rec_fail',
            },
        };
        if (shouldSkipSync(record.updated_at)) {
            if (store.getPendingSync()) {
                store.setPendingSync(false);
                store.setState(newState);
            }
            return;
        }

        methods.reset(toFormPartial(record), {
            keepValues: false,
            keepErrors: false,
            keepTouched: false,
            keepDirty: false,
        });
        const nonField = syncServerErrors(record.errors ?? [], methods);
        const errorCount = record.errors?.length || 0;
        store.setState({ globalErrors: nonField, hasErrors: errorCount > 0 });

        store.setSnapshotRef(JSON.stringify(toFormPartial(record)));

        if (store.getPendingSync()) {
            store.setPendingSync(false);
            store.setState(newState);
        }
    });

    useEffect(() => {
        if (!activeRecord) return;
        onSync(activeRecord);

        // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        finishInit(activeRecord.id);
    }, [activeRecord]);

    useEffect(() => {
        if (!ENABLE_AUTO_SAVE) return () => {};

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
                const response = await updateRecord({
                    submit: source === 'submit',
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
        [updateRecord, publ_id, store],
    );

    const save = useCallback(
        (mode: 'manual' | 'submit') => async () => {
            cancelPendingAutoSave();
            const s = store.getState().status;
            if (s.phase === 'saving' || s.phase === 'syncing') return;

            store.setState({ status: { phase: 'saving', source: mode } });
            const values = methods.getValues();
            const response = await performSave(mode, values);
            const errorCount = response?.errors?.length || 0;
            if (response) {
                const nonField = syncServerErrors(response.errors ?? [], methods);
                store.setState({
                    lastSavedTime: new Date(),
                    globalErrors: nonField,
                    hasErrors: errorCount > 0,
                });
            }
            store.setState({ status: { phase: 'idle', submitted: mode === 'submit' } });
        },
        [cancelPendingAutoSave, methods, performSave, store],
    );

    const onNavigate = useCallback(
        (targetId: string) => {
            const state = store.getState();
            if (targetId === state.activeRecordId) return;

            cancelPendingAutoSave();
            store.setKnownRef(null);

            if (state.activeRecordId) {
                store.setState({ status: { phase: 'saving', source: 'auto' } });
                const submitted = state.status.phase === 'idle' && state.status.submitted;
                void performSave(submitted ? 'submit' : 'manual', methods.getValues());
            }

            store.setPendingSync(true);
            store.setState({
                status: { phase: 'syncing' },
                lastSavedTime: null,
                globalErrors: [],
            });
        },
        [cancelPendingAutoSave, methods, performSave, store],
    );

    const create = useCallback(async () => {
        try {
            cancelPendingAutoSave();

            if (store.getState().activeRecordId) {
                await performSave('manual', methods.getValues());
            }

            const created = await createRecord({ publ_id }).unwrap();

            store.setKnownRef({
                id: created.id,
                updatedAt: created.updated_at,
            });

            methods.reset(FORM_DEFAULT_VALUES, {
                keepValues: false,
                keepErrors: false,
                keepTouched: false,
                keepDirty: false,
            });

            void navigate(`/publication/${publ_id}/${created.id}`, { replace: true });
            store.setState({ lastSavedTime: null, globalErrors: [] });
        } catch {
            toast.error('Ошибка при создании записи');
        }
    }, [publ_id, createRecord, cancelPendingAutoSave, methods, performSave, navigate, store]);

    const deleteRecordAction = useCallback(
        async (id: string) => {
            const isActive = id === store.getState().activeRecordId;

            let nextId: string | null = null;
            if (isActive) {
                const remaining = recordIds.filter((rid) => rid !== id);
                nextId = remaining[0] ?? null;
            }

            try {
                await deleteRecord({ record_id: id, publ_id }).unwrap();
                if (isActive) {
                    void navigate(`/publication/${publ_id}/${nextId}`, { replace: true });
                    if (nextId === null) {
                        setInitialRecordLoaded(false);
                    }
                }
            } catch {
                toast.error('Ошибка при удалении записи');
            }
        },
        [publ_id, deleteRecord, recordIds, navigate, store],
    );

    const actions: RecordFormActions = useMemo(
        () => ({
            save: save('manual'),
            submit: save('submit'),
            onNavigate,
            create,
            deleteRecord: deleteRecordAction,
        }),
        [save, onNavigate, create, deleteRecordAction],
    );

    return (
        <StoreContext.Provider value={store}>
            <ActionsContext.Provider value={actions}>
                <PublIdContext.Provider value={publ_id}>{children}</PublIdContext.Provider>
            </ActionsContext.Provider>
        </StoreContext.Provider>
    );
}
