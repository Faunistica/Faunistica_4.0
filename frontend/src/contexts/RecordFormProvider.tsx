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
} from '@/api/recordAPI';
import { skipToken } from '@reduxjs/toolkit/query';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useNavigate, useParams } from 'react-router';
import { ActionsContext, PublIdContext, StateContext } from './useRecordFormContext';

export const AUTO_SAVE_DELAY = 2000;
const SHOULD_AUTO_SAVE = import.meta.env.VITE_DISABLE_AUTO_SAVE;

export type RecordFormPhase =
    | { phase: 'idle' }
    | { phase: 'saving'; source: 'manual' | 'submit' | 'auto' }
    | { phase: 'syncing' }
    | { phase: 'error'; message: string };

export interface RecordFormState {
    activeRecordId: string | null;
    status: RecordFormPhase;
    lastSavedTime: Date | null;
    nonFieldErrors: string[];
    isInitialLoading: boolean;
}

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

export {
    ActionsContext,
    StateContext,
    PublIdContext,
    useRecordFormContext,
    useRecordFormActions,
    useRecordFormState,
} from './useRecordFormContext';

export function RecordFormProvider({
    publ_id,
    methods,
    autoSaveDelay = AUTO_SAVE_DELAY,
    children,
}: RecordFormProviderProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const params = useParams();
    const [status, setStatus] = useState<RecordFormPhase>({ phase: 'idle' });
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);
    const [initialRecordLoaded, setInitialRecordLoaded] = useState(false);

    const recordIds = useAppSelector(
        (state) => {
            const result = recordAPI.endpoints.recordsList.select({ publ_id })(state);
            const data = 'data' in result ? result.data : undefined;
            return data?.items?.map((r) => r.id) ?? [];
        },
        (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
    );

    const explicitRecordId = params.record;
    const activeRecordId = explicitRecordId ?? recordIds[0] ?? null;

    const activeRecordIdRef = useRef(activeRecordId);
    const statusRef = useRef(status);
    const lastSnapshotRef = useRef<string>('');
    const lastKnownRef = useRef<{ id: string; updatedAt: string } | null>(null);
    const methodsRef = useRef(methods);
    const pendingSyncRef = useRef(false);

    const { isLoading: isListLoading } = useRecordsListQuery({ publ_id }, { skip: !publ_id });

    const { currentData: activeRecord } = useRecordByIdQuery(
        activeRecordId ? { record_id: activeRecordId } : skipToken,
        { refetchOnMountOrArgChange: true },
    );

    const [createRecord] = useCreateRecordMutation();
    const [editRecord] = useEditRecordMutation();
    const [submitRecord] = useSubmitRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    const shouldSkipSync = useCallback((updatedAt: string): boolean => {
        if (!lastKnownRef.current) return false;
        return (
            lastKnownRef.current.id === activeRecordIdRef.current &&
            lastKnownRef.current.updatedAt === updatedAt
        );
    }, []);

    const setPhase = useCallback((phase: RecordFormPhase) => {
        setStatus(phase);
        if (phase.phase !== 'idle') {
            setNonFieldErrors([]);
        }
    }, []);

    const { fn: debouncedAutoSave, cancel: cancelPendingAutoSave } = useDebouncedCallback(
        async () => {
            const id = activeRecordIdRef.current;
            if (!id) return;

            const currentValues = methods.getValues();
            const currentSnapshot = JSON.stringify(currentValues);
            if (currentSnapshot === lastSnapshotRef.current) return;

            setPhase({ phase: 'saving', source: 'auto' });
            try {
                const payload = draftToRecordData(currentValues);
                const response = await editRecord({
                    record_id: id,
                    data: payload,
                    publ_id,
                }).unwrap();
                lastSnapshotRef.current = currentSnapshot;
                lastKnownRef.current = {
                    id,
                    updatedAt: response.updated_at,
                };
                setLastSavedTime(new Date());
                setPhase({ phase: 'idle' });
            } catch {
                setPhase({ phase: 'idle' });
            }
        },
        autoSaveDelay,
    );

    useEffect(() => {
        activeRecordIdRef.current = activeRecordId;
    }, [activeRecordId]);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        methodsRef.current = methods;
    });

    useEffect(() => {
        if (!activeRecord) return;

        if (shouldSkipSync(activeRecord.updated_at)) {
            if (pendingSyncRef.current) {
                pendingSyncRef.current = false;
                setStatus({ phase: 'idle' });
            }
            if (!initialRecordLoaded) {
                // TODO: maybe this can be rewritten in a better way
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
        setNonFieldErrors(nonField);

        lastSnapshotRef.current = JSON.stringify(toFormPartial(activeRecord));

        if (!initialRecordLoaded) {
            setInitialRecordLoaded(true);
            void navigate(`/publication/${publ_id}/${activeRecord.id}`, { replace: true });
        }

        if (pendingSyncRef.current) {
            pendingSyncRef.current = false;
            setStatus({ phase: 'idle' });
        }
    }, [activeRecord, shouldSkipSync, initialRecordLoaded, navigate, publ_id]);

    const isInitialLoading = isListLoading || (activeRecordId !== null && !initialRecordLoaded);

    useEffect(() => {
        if (!SHOULD_AUTO_SAVE) return () => {};

        const subscription = methods.watch(() => {
            if (statusRef.current.phase === 'saving') return;

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
            const id = activeRecordIdRef.current;
            if (!id) return undefined;

            try {
                const payload = draftToRecordData(values);
                const response = await editRecord({
                    record_id: id,
                    data: payload,
                    publ_id,
                }).unwrap();
                if (activeRecordIdRef.current === id) {
                    lastKnownRef.current = {
                        id,
                        updatedAt: response.updated_at,
                    };
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
        if (statusRef.current.phase === 'saving' || statusRef.current.phase === 'syncing') return;

        setPhase({ phase: 'saving', source: 'manual' });
        const values = methodsRef.current.getValues();
        const response = await performSave('manual', values);
        if (response) {
            setLastSavedTime(new Date());
            const nonField = syncServerErrors(response.errors ?? [], methodsRef.current);
            setNonFieldErrors(nonField);
        }
        setPhase({ phase: 'idle' });
    }, [cancelPendingAutoSave, performSave, setPhase]);

    const submit = useCallback(async () => {
        cancelPendingAutoSave();
        const s = statusRef.current;
        if (s.phase === 'saving' || s.phase === 'syncing') return;

        const id = activeRecordIdRef.current;
        if (!id) return;

        setPhase({ phase: 'saving', source: 'submit' });
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
            lastKnownRef.current = {
                id,
                updatedAt: response.updated_at,
            };
            setLastSavedTime(new Date());
            const nonField = syncServerErrors(response.errors ?? [], methodsRef.current);
            setNonFieldErrors(nonField);
            setPhase({ phase: 'idle' });
        } catch {
            setPhase({ phase: 'idle' });
        }
    }, [cancelPendingAutoSave, editRecord, submitRecord, publ_id, setPhase]);

    const switchTo = useCallback(
        (targetId: string) => {
            if (targetId === activeRecordIdRef.current) return;

            cancelPendingAutoSave();
            lastKnownRef.current = null;

            if (activeRecordIdRef.current) {
                setPhase({ phase: 'saving', source: 'manual' });
                void performSave('manual', methodsRef.current.getValues());
            }

            pendingSyncRef.current = true;
            void navigate(`/publication/${publ_id}/${targetId}`, { replace: true });
            setPhase({ phase: 'syncing' });
            setLastSavedTime(null);
            setNonFieldErrors([]);
        },
        [cancelPendingAutoSave, performSave, setPhase, navigate, publ_id],
    );

    const create = useCallback(async () => {
        try {
            cancelPendingAutoSave();

            if (activeRecordIdRef.current) {
                await performSave('manual', methodsRef.current.getValues());
            }

            const created = await createRecord({ publ_id }).unwrap();
            void dispatch(
                recordAPI.util.upsertQueryData('recordById', { record_id: created.id }, created),
            );

            lastKnownRef.current = {
                id: created.id,
                updatedAt: created.updated_at,
            };

            methodsRef.current.reset(FORM_DEFAULT_VALUES, {
                keepValues: false,
                keepErrors: false,
                keepTouched: false,
                keepDirty: false,
            });

            void navigate(`/publication/${publ_id}/${created.id}`, { replace: true });
            setLastSavedTime(null);
            setNonFieldErrors([]);
        } catch {
            toast.error('Ошибка при создании записи');
        }
    }, [publ_id, createRecord, dispatch, cancelPendingAutoSave, performSave, navigate]);

    const deleteRecordAction = useCallback(
        async (id: string) => {
            const listArgs = { publ_id };
            const isActive = id === activeRecordIdRef.current;

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

    const state: RecordFormState = useMemo(
        () => ({
            activeRecordId,
            status,
            lastSavedTime,
            nonFieldErrors,
            isInitialLoading,
        }),
        [activeRecordId, status, lastSavedTime, nonFieldErrors, isInitialLoading],
    );

    const actions: RecordFormActions = useMemo(
        () => ({ save, submit, switchTo, create, deleteRecord: deleteRecordAction }),
        [save, submit, switchTo, create, deleteRecordAction],
    );

    return (
        <ActionsContext.Provider value={actions}>
            <StateContext.Provider value={state}>
                <PublIdContext.Provider value={publ_id}>{children}</PublIdContext.Provider>
            </StateContext.Provider>
        </ActionsContext.Provider>
    );
}
