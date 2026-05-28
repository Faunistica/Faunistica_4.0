import { useContext } from 'react';
import { ActionsContext, StateContext, PublIdContext } from './RecordFormProvider';
import type { RecordFormActions, RecordFormState } from './RecordFormProvider';

export function useRecordFormContext(): {
    state: RecordFormState;
    actions: RecordFormActions;
    publ_id: number;
} {
    const state = useContext(StateContext);
    const actions = useContext(ActionsContext);
    const publ_id = useContext(PublIdContext);

    if (!state || !actions || publ_id === null) {
        throw new Error('useRecordFormContext must be used within a RecordFormProvider');
    }

    return { state, actions, publ_id };
}

export function useRecordFormActions(): RecordFormActions {
    const actions = useContext(ActionsContext);
    if (!actions) {
        throw new Error('useRecordFormActions must be used within a RecordFormProvider');
    }
    return actions;
}

export function useRecordFormState(): RecordFormState {
    const state = useContext(StateContext);
    if (!state) {
        throw new Error('useRecordFormState must be used within a RecordFormProvider');
    }
    return state;
}
