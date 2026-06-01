import { useEffect } from 'react';
import { draftToRecordData } from '@/lib/recordUtils';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type { FormStore } from '@/contexts/recordFormStore';
import type { RecordForm } from '@/types/forms';
import { useUpdateRecordMutation } from '@/api/recordAPI';
import type { UseFormWatch } from 'react-hook-form';

const ENABLE_AUTO_SAVE = import.meta.env.VITE_DISABLE_AUTO_SAVE;

export const useAutoSave = ({
    store,
    autoSaveDelay,
    getValues,
    publ_id,
    watch,
}: {
    store: FormStore;
    autoSaveDelay: number;
    publ_id: number;
    getValues: () => RecordForm;
    watch: UseFormWatch<RecordForm>;
}): (() => void) => {
    const [updateRecord] = useUpdateRecordMutation();

    const { fn: debouncedAutoSave, cancel: cancelAutoSave } = useDebouncedCallback(async () => {
        const id = store.getState().activeRecordId;
        if (!id) return;

        const currentValues = getValues();
        const currentSnapshot = JSON.stringify(currentValues);
        if (currentSnapshot === store.getSnapshotRef()) return;

        store.setState({ status: { phase: 'saving', source: 'auto' } });
        try {
            const payload = draftToRecordData(currentValues);
            const response = await updateRecord({
                submit: false,
                record_id: id,
                data: payload,
                publ_id,
            }).unwrap();
            store.setKnownRef({
                id,
                updatedAt: response.updated_at,
            });
            store.setState({
                lastSavedTime: new Date(),
                status: { phase: 'idle', submitted: false },
            });
            store.setSnapshotRef(currentSnapshot);
        } catch {
            store.setState({ status: { phase: 'idle', submitted: false } });
        }
    }, autoSaveDelay);

    useEffect(() => {
        if (!ENABLE_AUTO_SAVE) return () => {};

        const subscription = watch(() => {
            if (store.getState().status.phase === 'saving') return;

            debouncedAutoSave();
        });

        return () => {
            subscription.unsubscribe();
            cancelAutoSave();
        };
    }, [watch, debouncedAutoSave, cancelAutoSave, store]);

    return cancelAutoSave;
};
