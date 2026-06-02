import { useSyncExternalStore, useCallback, useRef } from 'react';
import { useFormStore, type FormState } from './formStore';
import { useRecordFormActions, type RecordFormActions } from './useRecordFormActions';

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

function statesEqual(a: RecordFormState, b: RecordFormState): boolean {
    return (
        a.publ_id === b.publ_id &&
        a.activeRecordId === b.activeRecordId &&
        a.recordIds === b.recordIds &&
        a.status === b.status &&
        a.lastSavedTime === b.lastSavedTime &&
        a.globalErrors === b.globalErrors &&
        a.hasErrors === b.hasErrors &&
        a.isInitialLoading === b.isInitialLoading &&
        a.isSaving === b.isSaving &&
        a.isAutoSaving === b.isAutoSaving &&
        a.isBusy === b.isBusy &&
        a.hasRecords === b.hasRecords &&
        a.autoSaveDelay === b.autoSaveDelay
    );
}

function useFormStateSync(store: ReturnType<typeof useFormStore>): RecordFormState {
    const prevRef = useRef<RecordFormState | null>(null);
    const getSnapshot = useCallback(() => {
        const next = computeFormState(store.getState());
        const prev = prevRef.current;
        if (prev && statesEqual(prev, next)) {
            return prev;
        }
        prevRef.current = next;
        return next;
    }, [store]);
    return useSyncExternalStore(
        useCallback((cb: () => void) => store.subscribe(cb), [store]),
        getSnapshot,
    );
}

export function useRecordForm(): {
    state: RecordFormState;
    actions: RecordFormActions;
    publ_id: number;
};
export function useRecordForm<T>(
    selector: (ctx: { state: RecordFormState; actions: RecordFormActions; publ_id: number }) => T,
): T;
export function useRecordForm<T>(
    selector?: (ctx: { state: RecordFormState; actions: RecordFormActions; publ_id: number }) => T,
): T | { state: RecordFormState; actions: RecordFormActions; publ_id: number } {
    const store = useFormStore();
    const actions = useRecordFormActions(store);

    const state = useFormStateSync(store);
    const publ_id = useSyncExternalStore(
        useCallback((cb: () => void) => store.subscribe(cb), [store]),
        useCallback(() => store.getState().publ_id, [store]),
    );

    if (selector) {
        return selector({ state, actions, publ_id });
    }

    return { state, actions, publ_id };
}
