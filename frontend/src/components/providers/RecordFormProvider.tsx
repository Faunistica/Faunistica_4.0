import { type ReactNode, useEffect, useEffectEvent, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { RecordFull } from '@/types/api.dto';
import { toFormPartial } from '@/lib/recordUtils';
import { syncServerErrors } from '@/lib/syncServerErrors';
import { useRecordsListQuery, useRecordByIdQuery } from '@/api/recordAPI';
import { useRecordIDs } from '@/hooks/useRecordIDs';
import { useNavigate, useParams } from 'react-router';
import { createFormStore, type FormState, StoreContext } from '@/store/formStore';
import { ActionsContext } from '@/store/formActionsContext';
import { useRecordFormActions } from '@/hooks/useRecordFormActions';
import type { SerializedError } from '@reduxjs/toolkit';
import type { TypedFetchBaseQueryError } from '@/api/baseQuery';
import type { RecordForm } from '@/types/forms';
import { skipToken } from '@reduxjs/toolkit/query';

interface RecordFormProviderProps {
    publ_id: number;
    autoSaveDelay?: number;
    children: ReactNode;
}

export const AUTO_SAVE_DELAY = 2000;

export function RecordFormProvider({
    publ_id,
    autoSaveDelay = AUTO_SAVE_DELAY,
    children,
}: RecordFormProviderProps) {
    const methods = useFormContext<RecordForm>();
    const navigate = useNavigate();
    const { record: recordParam } = useParams();

    const [initialRecordLoaded, setInitialRecordLoaded] = useState(false);
    const [store] = useState(() => createFormStore(publ_id, autoSaveDelay));

    const recordIds = useRecordIDs(publ_id);
    const { isLoading: isListLoading } = useRecordsListQuery(
        { publ_id },
        { selectFromResult: ({ isLoading }) => ({ isLoading }) },
    );

    const activeRecordId = recordParam ?? (recordIds.length > 0 ? recordIds[0] : null);
    const { currentData: activeRecord, error: getRecordError } = useRecordByIdQuery(
        (activeRecordId && { record_id: activeRecordId }) || skipToken,
        { refetchOnMountOrArgChange: true },
    );

    const handleGetError = useEffectEvent(
        (error: SerializedError | TypedFetchBaseQueryError | undefined) => {
            if (error) {
                void navigate(`/publication/${publ_id}`, { replace: true });
            }
        },
    );

    useEffect(() => {
        handleGetError(getRecordError);
    }, [getRecordError]);

    const isInitialLoading = isListLoading || (activeRecordId !== null && !initialRecordLoaded);

    useEffect(() => {
        store.setState({ activeRecordId, isInitialLoading });
    }, [activeRecordId, isInitialLoading, store]);

    const finishInit = useEffectEvent((recordId: string) => {
        if (initialRecordLoaded) return;
        setInitialRecordLoaded(true);
        void navigate(`/publication/${publ_id}/${recordId}`, { replace: true });
    });

    const onSync = useEffectEvent((record: RecordFull) => {
        const newState: Partial<FormState> = {
            status: {
                phase: 'idle',
                submitted: record.type === 'rec_ok' || record.type === 'rec_fail',
            },
        };

        const currentSnapshot = JSON.stringify(toFormPartial(record));
        if (currentSnapshot === store.getState().snapshot) {
            if (store.getState().pendingSync) {
                store.setState({ pendingSync: false, ...newState });
            }
            return;
        }

        methods.reset(toFormPartial(record), {
            keepValues: false,
            keepErrors: false,
            keepTouched: false,
            keepDirty: false,
        });
        const nonField = syncServerErrors(record.errors ?? [], methods);
        const errorCount = record.errors?.length || 0;
        store.setState({ globalErrors: nonField, hasErrors: errorCount > 0 });

        store.setState({ snapshot: currentSnapshot });

        if (store.getState().pendingSync) {
            store.setState({ pendingSync: false, ...newState });
        }
    });

    useEffect(() => {
        if (!activeRecord) return;
        onSync(activeRecord);

        // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        finishInit(activeRecord.id);
    }, [activeRecord]);

    const actions = useRecordFormActions(store);

    return (
        <StoreContext.Provider value={store}>
            <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
        </StoreContext.Provider>
    );
}
