import { createContext, useContext } from 'react';
import type { RecordFormPhase } from './RecordFormProvider';

export interface FormStoreState {
    activeRecordId: string | null;
    recordIds: string[];
    status: RecordFormPhase;
    lastSavedTime: Date | null;
    globalErrors: string[];
    hasErrors: boolean;
    isInitialLoading: boolean;
}

export interface FormStore {
    getState: () => FormStoreState;
    subscribe: (listener: () => void) => () => void;
    setState: (partial: Partial<FormStoreState>) => void;
    getSnapshotRef: () => string;
    setSnapshotRef: (val: string) => void;
    getKnownRef: () => { id: string; updatedAt: string } | null;
    setKnownRef: (val: { id: string; updatedAt: string } | null) => void;
    getPendingSync: () => boolean;
    setPendingSync: (val: boolean) => void;
}

export function createFormStore(): FormStore {
    let state: FormStoreState = {
        activeRecordId: null,
        recordIds: [],
        status: { phase: 'idle' },
        lastSavedTime: null,
        globalErrors: [],
        hasErrors: false,
        isInitialLoading: true,
    };
    const listeners = new Set<() => void>();
    let snapshotRef = '';
    let knownRef: { id: string; updatedAt: string } | null = null;
    let pendingSync = false;

    return {
        getState: () => state,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        setState: (partial) => {
            let changed = false;
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            for (const key of Object.keys(partial) as Array<keyof FormStoreState>) {
                if (!Object.is(state[key], partial[key])) {
                    changed = true;
                    break;
                }
            }
            if (!changed) return;
            state = { ...state, ...partial };
            listeners.forEach((l) => l());
        },
        getSnapshotRef: () => snapshotRef,
        setSnapshotRef: (val) => {
            snapshotRef = val;
        },
        getKnownRef: () => knownRef,
        setKnownRef: (val) => {
            knownRef = val;
        },
        getPendingSync: () => pendingSync,
        setPendingSync: (val) => {
            pendingSync = val;
        },
    };
}

export const StoreContext = createContext<FormStore | null>(null);

export function useFormStore(): FormStore {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error('useFormStore must be used within a RecordFormProvider');
    }
    return store;
}
