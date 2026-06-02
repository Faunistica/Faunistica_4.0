import { useFormStore, type FormState } from './formStore';
import { useRecordFormActions, type RecordFormActions } from './useRecordFormActions';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

export type RecordFormState = Omit<FormState, 'snapshot' | 'pendingSync'> & {
    isSaving: boolean;
    isAutoSaving: boolean;
    isBusy: boolean;
};

function computeFormState(s: FormState): RecordFormState {
    const isSaving = s.status.phase === 'saving';
    return {
        publ_id: s.publ_id,
        activeRecordId: s.activeRecordId,
        status: s.status,
        lastSavedTime: s.lastSavedTime,
        globalErrors: s.globalErrors,
        hasErrors: s.hasErrors,
        isInitialLoading: s.isInitialLoading,
        isSaving,
        isAutoSaving: isSaving && 'source' in s.status && s.status.source === 'auto',
        isBusy: isSaving || s.status.phase === 'syncing',
        autoSaveDelay: s.autoSaveDelay,
    };
}

export function useRecordForm(): {
    state: RecordFormState;
    actions: RecordFormActions;
};
export function useRecordForm<T>(selector: (ctx: { state: RecordFormState }) => T): {
    state: T;
    actions: RecordFormActions;
};
export function useRecordForm<T>(selector?: (ctx: { state: RecordFormState }) => T): {
    state: RecordFormState | T;
    actions: RecordFormActions;
} {
    const store = useFormStore();
    const actions = useRecordFormActions(store);

    const state = useStore(store, useShallow(computeFormState));

    if (selector) {
        return { state: selector({ state }), actions };
    }

    return { state, actions };
}
