import { createStore, type StoreApi } from 'zustand/vanilla';
import { createContext, useContext } from 'react';

export type RecordFormPhase =
    | { phase: 'idle'; submitted: boolean }
    | { phase: 'saving'; source: 'manual' | 'submit' | 'auto' }
    | { phase: 'syncing' }
    | { phase: 'error'; message: string };

export interface FormState {
    publ_id: number;
    activeRecordId: string | null;
    recordIds: string[];
    status: RecordFormPhase;
    lastSavedTime: Date | null;
    globalErrors: string[];
    hasErrors: boolean;
    isInitialLoading: boolean;
    // Internal optimization state - not part of reactive equality checks
    _snapshotRef: string;
    _pendingSync: boolean;
}

export const getInitialState = (publ_id: number): FormState => ({
    publ_id,
    activeRecordId: null,
    recordIds: [],
    status: { phase: 'idle', submitted: false },
    lastSavedTime: null,
    globalErrors: [],
    hasErrors: false,
    isInitialLoading: true,
    _snapshotRef: '',
    _pendingSync: false,
});

export type FormStore = StoreApi<FormState>;

export function createFormStore(publ_id: number): FormStore {
    return createStore<FormState>(() => getInitialState(publ_id));
}

export const StoreContext = createContext<FormStore | null>(null);

export function useFormStore(): FormStore {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error('useFormStore must be used within a RecordFormProvider');
    }
    return store;
}
