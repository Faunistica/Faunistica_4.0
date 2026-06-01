import { createContext, useCallback, useContext, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import { type FormStoreState, useFormStore } from './recordFormStore';

export interface RecordFormActions {
    save: () => Promise<void>;
    submit: () => Promise<void>;
    onNavigate: (targetId: string) => void;
    create: () => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
}

export type RecordFormState = FormStoreState & {
    isSaving: boolean;
    isAutoSaving: boolean;
    isBusy: boolean;
    hasRecords: boolean;
};

function computeFormState(s: FormStoreState): RecordFormState {
    const isSaving = s.status.phase === 'saving';
    return {
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
    };
}

function statesEqual(a: RecordFormState, b: RecordFormState): boolean {
    return (
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
        a.hasRecords === b.hasRecords
    );
}

type Snapshot<T> = { kind: 'selected'; value: T } | { kind: 'bulk'; state: RecordFormState };

export const ActionsContext = createContext<RecordFormActions | null>(null);
export const PublIdContext = createContext<number>(0);

export function useRecordForm(): {
    state: RecordFormState;
    actions: RecordFormActions;
    publ_id: number;
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
