import type { RecordFormPhase } from './RecordFormProvider';

export interface FormStoreState {
    activeRecordId: string | null;
    status: RecordFormPhase;
    lastSavedTime: Date | null;
    nonFieldErrors: string[];
    isInitialLoading: boolean;
}

type Listener = () => void;

let storeState: FormStoreState = {
    activeRecordId: null,
    status: { phase: 'idle' },
    lastSavedTime: null,
    nonFieldErrors: [],
    isInitialLoading: true,
};

const listeners = new Set<Listener>();

export const getState = (): FormStoreState => storeState;

export const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function setState(partial: Partial<FormStoreState>): void {
    let changed = false;
    const prev = storeState;
    for (const [key, value] of Object.entries(partial)) {
        if (!Object.is(prev[key], value)) {
            changed = true;
            break;
        }
    }
    if (!changed) return;
    storeState = { ...prev, ...partial };
    listeners.forEach((l) => l());
}

// Module-level tracking vars (replacements for useRef)
let _lastSnapshotRef = '';
let _lastKnown: { id: string; updatedAt: string } | null = null;
let _pendingSync = false;

export function getLastSnapshot(): string {
    return _lastSnapshotRef;
}
export function setLastSnapshot(val: string): void {
    _lastSnapshotRef = val;
}

export function getLastKnown(): { id: string; updatedAt: string } | null {
    return _lastKnown;
}
export function setLastKnown(val: { id: string; updatedAt: string } | null): void {
    _lastKnown = val;
}

export function getPendingSync(): boolean {
    return _pendingSync;
}
export function setPendingSync(val: boolean): void {
    _pendingSync = val;
}
