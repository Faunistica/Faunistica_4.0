import { useFormStore, type FormState } from './formStore';
import { useRecordFormActions, type RecordFormActions } from './useRecordFormActions';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

export type RecordFormState = Omit<FormState, 'snapshot' | 'pendingSync'> & {
    isSaving: boolean;
    isAutoSaving: boolean;
    isBusy: boolean;
    hasRecords: boolean;
};

function computeFormState(s: FormState): RecordFormState {
    const isSaving = s.status.phase === 'saving';
    return {
        publ_id: s.publ_id,
        activeRecordId: s.activeRecordId,
        recordIds: s.recordIds,
        status: s.status,
        lastSavedTime: s.lastSavedTime,
        globalErrors: s.globalErrors,
        hasErrors: s.hasErrors,
        isInitialLoading: s.isInitialLoading,
        isSaving,
        isAutoSaving: isSaving && 'source' in s.status && s.status.source === 'auto',
        isBusy: isSaving || s.status.phase === 'syncing',
        hasRecords: s.recordIds.length > 0,
        autoSaveDelay: s.autoSaveDelay,
    };
}

export function useRecordForm(): {
    state: RecordFormState;
    actions: RecordFormActions;
    publ_id: number;
};
export function useRecordForm<T>(selector: (ctx: { state: RecordFormState }) => T): {
    state: T;
    actions: RecordFormActions;
    publ_id: number;
};
export function useRecordForm<T>(selector?: (ctx: { state: RecordFormState }) => T): {
    state: RecordFormState | T;
    actions: RecordFormActions;
    publ_id: number;
} {
    const store = useFormStore();
    const actions = useRecordFormActions(store);

    const state = useStore(store, useShallow(computeFormState));
    const publ_id = useStore(store, (data) => data.publ_id);

    if (selector) {
        return { state: selector({ state }), actions, publ_id };
    }

    return { state, actions, publ_id };
}
