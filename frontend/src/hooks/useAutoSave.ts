import { useEffect, useRef } from 'react';
import { draftToRecordData } from '@/lib/recordUtils';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type { FormStore } from '@/store/formStore';
import type { RecordForm } from '@/types/forms';
import { useUpdateRecordMutation } from '@/api/recordAPI';
import type { UseFormWatch, UseFormGetValues } from 'react-hook-form';

const raw = import.meta.env.VITE_DISABLE_AUTO_SAVE;
const DISABLE_AUTO_SAVE = (() => {
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false' || raw === undefined) return false;
    throw new Error(`Invalid VITE_DISABLE_AUTO_SAVE: ${JSON.stringify(raw)}`);
})();

export const useAutoSave = ({
    store,
    getValues,
    publ_id,
    watch,
}: {
    store: FormStore;
    publ_id: number;
    getValues: UseFormGetValues<RecordForm>;
    watch: UseFormWatch<RecordForm>;
}): (() => void) => {
    const [updateRecord] = useUpdateRecordMutation();

    const activeRecordRef = useRef(store.getState().activeRecordId);

    const { fn: debouncedAutoSave, cancel: cancelAutoSave } = useDebouncedCallback(async () => {
        const id = store.getState().activeRecordId;
        if (!id) return;

        const currentValues = getValues();
        const currentSnapshot = JSON.stringify(currentValues);
        if (currentSnapshot === store.getState().snapshot) return;

        store.setState({ status: { phase: 'saving', source: 'auto' } });
        try {
            const payload = draftToRecordData(currentValues);
            await updateRecord({
                submit: false,
                record_id: id,
                data: payload,
                publ_id,
            }).unwrap();
            store.setState({
                lastSavedTime: new Date(),
                status: { phase: 'idle', submitted: false },
            });
            store.setState({ snapshot: currentSnapshot });
        } catch {
            store.setState({ status: { phase: 'idle', submitted: false } });
        }
    }, store.getState().autoSaveDelay);

    useEffect(() => {
        if (DISABLE_AUTO_SAVE) return () => {};

        const subscription = watch(() => {
            const currentId = store.getState().activeRecordId;
            const prevId = activeRecordRef.current;
            activeRecordRef.current = currentId;
            if (prevId !== null && prevId !== currentId) return;

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
