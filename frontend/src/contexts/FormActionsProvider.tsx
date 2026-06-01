import { createContext, type ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useFormContext } from 'react-hook-form';
import type { RecordFull } from '@/types/api.dto';
import { draftToRecordData } from '@/lib/recordUtils';
import { FORM_DEFAULT_VALUES, type RecordForm } from '@/types/forms';
import { syncServerErrors } from '@/lib/syncServerErrors';
import {
    useCreateRecordMutation,
    useUpdateRecordMutation,
    useDeleteRecordMutation,
} from '@/api/recordAPI';
import { useNavigate } from 'react-router';
import { useFormStore } from './recordFormStore';
import { useAutoSave } from '@/hooks/useAutoSave';

export interface RecordFormActions {
    save: () => Promise<void>;
    submit: () => Promise<void>;
    onNavigate: (targetId: string) => void;
    create: () => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
}

export const AUTO_SAVE_DELAY = 2000;
export const ActionsContext = createContext<RecordFormActions | null>(null);

export function FormActionsProvider({
    publ_id,
    children,
    autoSaveDelay = AUTO_SAVE_DELAY,
    onDelete,
}: {
    publ_id: number;
    children: ReactNode;
    autoSaveDelay?: number;
    onDelete: (id: string) => () => void;
}) {
    const navigate = useNavigate();
    const store = useFormStore();

    const [createRecord] = useCreateRecordMutation();
    const [updateRecord] = useUpdateRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    const methods = useFormContext<RecordForm>();

    const cancelAutoSave = useAutoSave({ store, publ_id, autoSaveDelay, ...methods });

    const performSave = useCallback(
        async (
            record_id: string,
            source: 'manual' | 'submit',
            values: Partial<RecordForm>,
        ): Promise<RecordFull | undefined> => {
            try {
                const payload = draftToRecordData(values);
                const response = await updateRecord({
                    submit: source === 'submit',
                    record_id: record_id,
                    data: payload,
                    publ_id,
                }).unwrap();
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
        [updateRecord, publ_id],
    );

    const save = useCallback(
        (mode: 'manual' | 'submit') => async () => {
            cancelAutoSave();
            const state = store.getState();
            const status = state.status;
            if (!state.activeRecordId || status.phase === 'saving' || status.phase === 'syncing') {
                return;
            }

            store.setState({ status: { phase: 'saving', source: mode } });
            const values = methods.getValues();
            const response = await performSave(state.activeRecordId, mode, values);
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
        [cancelAutoSave, methods, performSave, store],
    );

    const onNavigate = useCallback(
        (targetId: string) => {
            const state = store.getState();
            if (targetId === state.activeRecordId) return;

            cancelAutoSave();

            if (state.activeRecordId) {
                store.setState({ status: { phase: 'saving', source: 'auto' } });
                const submitted = state.status.phase === 'idle' && state.status.submitted;
                void performSave(
                    state.activeRecordId,
                    submitted ? 'submit' : 'manual',
                    methods.getValues(),
                );
            }

            store.setPendingSync(true);
            store.setState({
                status: { phase: 'syncing' },
                lastSavedTime: null,
                globalErrors: [],
            });
        },
        [cancelAutoSave, methods, performSave, store],
    );

    const create = useCallback(async () => {
        try {
            cancelAutoSave();

            const id = store.getState().activeRecordId;
            if (id) {
                await performSave(id, 'manual', methods.getValues());
            }

            const created = await createRecord({ publ_id }).unwrap();

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
    }, [publ_id, createRecord, cancelAutoSave, methods, performSave, navigate, store]);

    const deleteRecordAction = useCallback(
        async (id: string) => {
            const callback = onDelete(id);

            try {
                await deleteRecord({ record_id: id, publ_id }).unwrap();
                callback();
            } catch {
                toast.error('Ошибка при удалении записи');
            }
        },
        [publ_id, deleteRecord, onDelete],
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

    return <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>;
}
