import { useEffect, useRef, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormRecord } from '@/types/api.dto';

const SHOULD_AUTO_SAVE = !(import.meta.env.VITE_DISABLE_AUTO_SAVE?.toLowerCase?.() === 'true');

interface UseAutoSaveOptions {
    save: (data: Partial<FormRecord>) => Promise<void>;
    methods: UseFormReturn<FormRecord>;
    isSavingRef?: React.MutableRefObject<boolean>;
    onAutoSavingChange?: (saving: boolean) => void;
    onAutoSaved?: (time: Date) => void;
}

interface UseAutoSaveReturn {
    cancelPendingAutoSave: () => void;
}

export function useAutoSave({
    save,
    methods,
    isSavingRef,
    onAutoSavingChange,
    onAutoSaved,
}: UseAutoSaveOptions): UseAutoSaveReturn {
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastSnapshotRef = useRef<string>('');

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

                onAutoSavingChange?.(true);
                try {
                    await save(currentValues);
                    lastSnapshotRef.current = currentSnapshot;
                    onAutoSaved?.(new Date());
                } catch {
                    // auto-save errors handled by useSaveRecord
                } finally {
                    onAutoSavingChange?.(false);
                }
            }, 2000);
        });

        return () => {
            subscription.unsubscribe();
            cancelPendingAutoSave();
        };
    }, [watch, getValues, save, cancelPendingAutoSave, isSavingRef, onAutoSavingChange, onAutoSaved]);

    return { cancelPendingAutoSave };
}
