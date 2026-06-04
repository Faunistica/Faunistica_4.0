import { createContext, useContext } from 'react';
import type { RecordFormActions } from '@/hooks/useRecordFormActions';

export const ActionsContext = createContext<RecordFormActions | null>(null);

export function useFormActionsContext(): RecordFormActions {
    const actions = useContext(ActionsContext);
    if (!actions) {
        throw new Error('useFormActionsContext must be used within RecordFormProvider');
    }
    return actions;
}
