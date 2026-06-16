import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { RecordFull } from '@/types/api.dto';
import { FORM_DEFAULT_VALUES, type RecordForm } from '@/types/forms';
import { draftToRecordData } from '@/lib/recordUtils';
import { syncServerErrors } from '@/lib/syncServerErrors';
import {
    useUpdateRecordMutation,
    useCreateRecordMutation,
    useDeleteRecordMutation,
} from '@/api/recordAPI';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useRecordIDs } from '@/hooks/useRecordIDs';
import { type FormStore } from '@/store/formStore';

export interface RecordFormActions {
    submit: () => Promise<void>;
    onNavigate: (targetId: string) => void;
    create: () => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
}

export function useRecordFormActions(store: FormStore): RecordFormActions {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const methods = useFormContext<RecordForm>();
    const [updateRecord] = useUpdateRecordMutation();
    const [createRecord] = useCreateRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    const publ_id = store.getState().publ_id;
    const recordIds = useRecordIDs(publ_id);
    const cancelAutoSave = useAutoSave({ store, publ_id, ...methods });

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
                    source === 'submit' ? t('recordForm.submitError') : t('recordForm.saveError'),
                );
                return undefined;
            }
        },
        [updateRecord, publ_id, t],
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

            store.setState({ pendingSync: true });
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
            cancelAutoSave();
            store.setState({ snapshot: JSON.stringify(FORM_DEFAULT_VALUES) });

            void navigate(`/publication/${publ_id}/${created.id}`, { replace: true });
            store.setState({ lastSavedTime: null, globalErrors: [] });
        } catch {
            toast.error(t('recordForm.createError'));
        }
    }, [publ_id, createRecord, cancelAutoSave, methods, performSave, navigate, store, t]);

    const deleteRecordAction = useCallback(
        async (id: string) => {
            const state = store.getState();
            const isActive = id === state.activeRecordId;

            let nextId: string | null = null;
            if (isActive) {
                const remaining = recordIds.filter((rid) => rid !== id);
                nextId = remaining[0] ?? null;
            }

            try {
                await deleteRecord({ record_id: id, publ_id }).unwrap();

                // On success, navigate if we deleted the active record
                if (isActive) {
                    void navigate(`/publication/${publ_id}/${nextId}`, { replace: true });
                    // Note: if nextId is null, the provider will handle this via recordIds sync
                }
            } catch {
                toast.error(t('recordForm.deleteError'));
            }
        },
        [publ_id, deleteRecord, navigate, store, recordIds, t],
    );

    return useMemo(
        () => ({
            submit: save('submit'),
            onNavigate,
            create,
            deleteRecord: deleteRecordAction,
        }),
        [save, onNavigate, create, deleteRecordAction],
    );
}
