import {
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useEffectEvent,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createContext, useSyncExternalStore } from 'react';
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
    useEditRecordMutation,
    useSubmitRecordMutation,
    useDeleteRecordMutation,
    selectRecordIds,
} from '@/api/recordAPI';
import { skipToken } from '@reduxjs/toolkit/query';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useNavigate, useParams } from 'react-router';
import {
    createFormStore,
    type FormStoreState,
    StoreContext,
    useFormStore,
} from './recordFormStore';

export type RecordFormPhase =
    | { phase: 'idle' }
    | { phase: 'saving'; source: 'manual' | 'submit' | 'auto' }
    | { phase: 'syncing' }
    | { phase: 'error'; message: string };

export interface RecordFormActions {
    save: () => Promise<void>;
    submit: () => Promise<void>;
    onNavigate: (targetId: string) => void;
    create: () => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
}

export interface RecordFormState {
    activeRecordId: string | null;
    recordIds: string[];
    status: RecordFormPhase;
    lastSavedTime: Date | null;
    globalErrors: string[];
    isInitialLoading: boolean;
    isSaving: boolean;
    isAutoSaving: boolean;
    isBusy: boolean;
    hasRecords: boolean;
}

interface RecordFormProviderProps {
    publ_id: number;
    methods: UseFormReturn<FormRecord>;
    autoSaveDelay?: number;
    children: ReactNode;
}

const ActionsContext = createContext<RecordFormActions | null>(null);
export const PublIdContext = createContext<number>(0);

function computeFormState(s: FormStoreState): RecordFormState {
    const isSaving = s.status.phase === 'saving';
    return {
        activeRecordId: s.activeRecordId,
        recordIds: s.recordIds,
        status: s.status,
        lastSavedTime: s.lastSavedTime,
        globalErrors: s.globalErrors,
        isInitialLoading: s.isInitialLoading,
        isSaving,
        isAutoSaving: isSaving && 'source' in s.status && s.status.source === 'auto',
        isBusy: isSaving || s.status.phase === 'syncing',
        hasRecords: s.recordIds.length > 0,
    };
}

function statesEqual(a: RecordFormState, b: RecordFormState): boolean {
    return (
        a.activeRecordId === b.activeRecordId &&
        a.recordIds === b.recordIds &&
        a.status === b.status &&
        a.lastSavedTime === b.lastSavedTime &&
        a.globalErrors === b.globalErrors &&
        a.isInitialLoading === b.isInitialLoading &&
        a.isSaving === b.isSaving &&
        a.isAutoSaving === b.isAutoSaving &&
        a.isBusy === b.isBusy &&
        a.hasRecords === b.hasRecords
    );
}

type Snapshot<T> = { kind: 'selected'; value: T } | { kind: 'bulk'; state: RecordFormState };

export function useRecordForm(): {
    state: RecordFormState;
    actions: RecordFormActions;
    publId: number;
};
export function useRecordForm<T>(
    selector: (ctx: { state: RecordFormState; actions: RecordFormActions; publId: number }) => T,
): T;
export function useRecordForm<T>(
    selector?: (ctx: { state: RecordFormState; actions: RecordFormActions; publId: number }) => T,
): T | { state: RecordFormState; actions: RecordFormActions; publId: number } {
    const store = useFormStore();
    const actions = useContext(ActionsContext);
    const publId = useContext(PublIdContext);

    if (!actions) {
        throw new Error('useRecordForm must be used within a RecordFormProvider');
    }

    const actionsRef = useRef(actions);
    const publIdRef = useRef(publId);
    const selectorRef = useRef(selector);

    const prevRef = useRef<Snapshot<T> | null>(null);

    const getSnapshot = useCallback((): Snapshot<T> => {
        const raw = store.getState();
        const state = computeFormState(raw);
        const sel = selectorRef.current;

        if (sel) {
            const next = sel({ state, actions: actionsRef.current, publId: publIdRef.current });
            const prev = prevRef.current;
            if (prev?.kind === 'selected' && Object.is(prev.value, next)) {
                return prev;
            }
            const result: Snapshot<T> = { kind: 'selected', value: next };
            prevRef.current = result;
            return result;
        }

        const prev = prevRef.current;
        if (prev?.kind === 'bulk' && statesEqual(prev.state, state)) {
            return prev;
        }
        const result: Snapshot<T> = { kind: 'bulk', state };
        prevRef.current = result;
        return result;
    }, [store]);

    const snapshot = useSyncExternalStore(store.subscribe, getSnapshot);
    if (snapshot.kind === 'selected') {
        return snapshot.value;
    }
    return { state: snapshot.state, actions, publId };
}

export const AUTO_SAVE_DELAY = 2000;
const SHOULD_AUTO_SAVE = import.meta.env.VITE_DISABLE_AUTO_SAVE;

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
    const { currentData: activeRecord, error } = useRecordByIdQuery(
        activeRecordId ? { record_id: activeRecordId } : skipToken,
        { refetchOnMountOrArgChange: true },
    );

    useEffect(() => {
        if (error) {
            void navigate(`/publication/${publ_id}`, { replace: true });
        }
    }, [error, navigate, publ_id]);

    const [createRecord] = useCreateRecordMutation();
    const [editRecord] = useEditRecordMutation();
    const [submitRecord] = useSubmitRecordMutation();
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
        store.setState({ activeRecordId, isInitialLoading, recordIds });
    }, [activeRecordId, isInitialLoading, recordIds, store]);

    const finishInit = useEffectEvent((recordId: string) => {
        if (initialRecordLoaded) return;
        setInitialRecordLoaded(true);
        void navigate(`/publication/${publ_id}/${recordId}`, { replace: true });
    });

    const onSync = useEffectEvent((record: RecordFull) => {
        if (shouldSkipSync(record.updated_at)) {
            if (store.getPendingSync()) {
                store.setPendingSync(false);
                store.setState({ status: { phase: 'idle' } });
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
        store.setState({ globalErrors: nonField });

        store.setSnapshotRef(JSON.stringify(toFormPartial(record)));

        if (store.getPendingSync()) {
            store.setPendingSync(false);
            store.setState({ status: { phase: 'idle' } });
        }
    });

    useEffect(() => {
        if (!activeRecord) return;
        onSync(activeRecord);

        // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        finishInit(activeRecord.id);
    }, [activeRecord]);

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
        const s = store.getState().status;
        if (s.phase === 'saving' || s.phase === 'syncing') return;

        store.setState({ status: { phase: 'saving', source: 'manual' } });
        const values = methods.getValues();
        const response = await performSave('manual', values);
        if (response) {
            const nonField = syncServerErrors(response.errors ?? [], methods);
            store.setState({ lastSavedTime: new Date(), globalErrors: nonField });
        }
        store.setState({ status: { phase: 'idle' } });
    }, [cancelPendingAutoSave, methods, performSave, store]);

    const submit = useCallback(async () => {
        cancelPendingAutoSave();
        const s = store.getState().status;
        if (s.phase === 'saving' || s.phase === 'syncing') return;

        const id = store.getState().activeRecordId;
        if (!id) return;

        store.setState({ status: { phase: 'saving', source: 'submit' } });
        try {
            const values = methods.getValues();
            const payload = draftToRecordData(values);
            const response = await submitRecord({
                record_id: id,
                data: payload,
            }).unwrap();
            store.setKnownRef({
                id,
                updatedAt: response.updated_at,
            });
            store.setState({ lastSavedTime: new Date() });
            const nonField = syncServerErrors(response.errors ?? [], methods);
            store.setState({ globalErrors: nonField });
            store.setState({ status: { phase: 'idle' } });
        } catch {
            store.setState({ status: { phase: 'idle' } });
        }
    }, [cancelPendingAutoSave, methods, submitRecord, store]);

    const onNavigate = useCallback(
        (targetId: string) => {
            if (targetId === store.getState().activeRecordId) return;

            cancelPendingAutoSave();
            store.setKnownRef(null);

            if (store.getState().activeRecordId) {
                store.setState({ status: { phase: 'saving', source: 'manual' } });
                void performSave('manual', methods.getValues());
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
        () => ({ save, submit, onNavigate, create, deleteRecord: deleteRecordAction }),
        [save, submit, onNavigate, create, deleteRecordAction],
    );

    return (
        <StoreContext.Provider value={store}>
            <ActionsContext.Provider value={actions}>
                <PublIdContext.Provider value={publ_id}>{children}</PublIdContext.Provider>
            </ActionsContext.Provider>
        </StoreContext.Provider>
    );
}
