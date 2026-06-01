import { type ReactNode, useCallback, useEffect, useEffectEvent, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { RecordFull } from '@/types/api.dto';
import { toFormPartial } from '@/lib/recordUtils';
import { syncServerErrors } from '@/lib/syncServerErrors';
import { useRecordsListQuery, useRecordByIdQuery, selectRecordIds } from '@/api/recordAPI';
import { useNavigate, useParams } from 'react-router';
import { createFormStore, type FormStoreState, StoreContext } from './recordFormStore';
import { PublIdContext } from './useRecordForm';
import type { SerializedError } from '@reduxjs/toolkit';
import type { TypedFetchBaseQueryError } from '@/api/baseQuery';
import { FormActionsProvider } from './FormActionsProvider';
import type { RecordForm } from '@/types/forms';

interface RecordFormProviderProps {
    publ_id: number;
    children: ReactNode;
}

export interface RecordFormActions {
    save: () => Promise<void>;
    submit: () => Promise<void>;
    onNavigate: (targetId: string) => void;
    create: () => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
}

export function RecordFormProvider({ publ_id, children }: RecordFormProviderProps) {
    const methods = useFormContext<RecordForm>();
    const navigate = useNavigate();
    const { record: recordParam } = useParams();

    const [initialRecordLoaded, setInitialRecordLoaded] = useState(false);
    const [store] = useState(() => createFormStore());

    const { recordIds, isListLoading } = useRecordsListQuery(
        {
            publ_id,
            pivot_record_id: recordParam && !initialRecordLoaded ? recordParam : undefined,
        },
        {
            selectFromResult: ({ data, isLoading }) => ({
                recordIds: selectRecordIds({ data }),
                isListLoading: isLoading,
            }),
        },
    );

    const activeRecordId = recordParam ?? recordIds[0] ?? null;
    const { currentData: activeRecord, error: getRecordError } = useRecordByIdQuery(
        { record_id: activeRecordId },
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
        store.setState({ activeRecordId, isInitialLoading, recordIds });
    }, [activeRecordId, isInitialLoading, recordIds, store]);

    const finishInit = useEffectEvent((recordId: string) => {
        if (initialRecordLoaded) return;
        setInitialRecordLoaded(true);
        void navigate(`/publication/${publ_id}/${recordId}`, { replace: true });
    });

    const onSync = useEffectEvent((record: RecordFull) => {
        const newState: Partial<FormStoreState> = {
            status: {
                phase: 'idle',
                submitted: record.type === 'rec_ok' || record.type === 'rec_fail',
            },
        };

        const currentSnapshot = JSON.stringify(toFormPartial(record));
        if (currentSnapshot === store.getSnapshotRef()) {
            if (store.getPendingSync()) {
                store.setPendingSync(false);
                store.setState(newState);
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

        store.setSnapshotRef(currentSnapshot);

        if (store.getPendingSync()) {
            store.setPendingSync(false);
            store.setState(newState);
        }
    });

    useEffect(() => {
        if (!activeRecord) return;
        onSync(activeRecord);

        // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        finishInit(activeRecord.id);
    }, [activeRecord]);

    const onDelete = useCallback(
        (id: string) => {
            const isActive = id === store.getState().activeRecordId;

            let nextId: string | null = null;
            if (isActive) {
                const remaining = recordIds.filter((rid) => rid !== id);
                nextId = remaining[0] ?? null;
            }

            return () => {
                if (isActive) {
                    void navigate(`/publication/${publ_id}/${nextId}`, { replace: true });
                    if (nextId === null) {
                        setInitialRecordLoaded(false);
                    }
                }
            };
        },
        [publ_id, recordIds, navigate, store],
    );

    return (
        <StoreContext.Provider value={store}>
            <FormActionsProvider publ_id={publ_id} onDelete={onDelete}>
                <PublIdContext.Provider value={publ_id}>{children}</PublIdContext.Provider>
            </FormActionsProvider>
        </StoreContext.Provider>
    );
}
