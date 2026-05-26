import { useEffect, useRef, useCallback, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormRecord, UpdateRecordResponse } from '@/types/api.dto';

const SHOULD_AUTO_SAVE = !(import.meta.env.VITE_DISABLE_AUTO_SAVE?.toLowerCase?.() === 'true');

interface UseAutoSaveOptions {
    save: (data: Partial<FormRecord>) => Promise<UpdateRecordResponse | undefined>;
    methods: UseFormReturn<FormRecord>;
    isSavingRef?: React.MutableRefObject<boolean>;
    onSaved?: (response: UpdateRecordResponse) => void;
}

interface UseAutoSaveReturn {
    cancelPendingAutoSave: () => void;
    isAutoSaving: boolean;
}

export function useAutoSave({
    save,
    methods,
    isSavingRef,
    onSaved,
}: UseAutoSaveOptions): UseAutoSaveReturn {
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastSnapshotRef = useRef<string>('');
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    const { getValues, watch } = methods;

    const cancelPendingAutoSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = undefined;
        }
    }, []);

    useEffect(() => {
        if (!SHOULD_AUTO_SAVE) {
            return () => {};
        }

        const subscription = watch((_value, { type }) => {
            if (type !== 'change') return;

            cancelPendingAutoSave();

            autoSaveTimerRef.current = setTimeout(async () => {
                if (isSavingRef?.current) return;

                const currentValues = getValues();
                const currentSnapshot = JSON.stringify(currentValues);

                if (currentSnapshot === lastSnapshotRef.current) {
                    return;
                }

                setIsAutoSaving(true);
                try {
                    const response = await save(currentValues);
                    lastSnapshotRef.current = currentSnapshot;
                    if (response) onSaved?.(response);
                } catch {
                    // auto-save errors handled by useSaveRecord
                } finally {
                    setIsAutoSaving(false);
                }
            }, 2000);
        });

        return () => {
            subscription.unsubscribe();
            cancelPendingAutoSave();
        };
    }, [watch, getValues, save, cancelPendingAutoSave, isSavingRef, onSaved]);

    return { cancelPendingAutoSave, isAutoSaving };
}
