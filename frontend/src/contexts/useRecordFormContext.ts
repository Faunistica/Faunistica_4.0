import { createContext, useContext } from 'react';
import type { RecordFormActions } from './RecordFormProvider';

export const ActionsContext = createContext<RecordFormActions | null>(null);
export const PublIdContext = createContext<number>(0);

export function useRecordFormActions(): RecordFormActions {
    const actions = useContext(ActionsContext);
    if (!actions) {
        throw new Error('useRecordFormActions must be used within a RecordFormProvider');
    }
    return actions;
}
