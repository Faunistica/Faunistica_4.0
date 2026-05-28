// src/hooks/useAutoSave.ts
//
// Автосохранение с debounce и snapshot-сравнением.
// Пропускает вызов handleSave, если данные не изменились.

import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormSchema } from '@/types/forms';

interface UseAutoSaveOptions {
    methods: UseFormReturn<FormSchema>;
    handleSave: (data: FormSchema, isManual: boolean, targetIndex?: number) => Promise<void>;
    /** Задержка debounce в мс (по умолчанию 2000). */
    delay?: number;
}

export function useAutoSave({ methods, handleSave, delay = 2000 }: UseAutoSaveOptions) {
    const { watch, getValues } = methods;

    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout>();
    const lastSnapshotRef = useRef<string>('');

    useEffect(() => {
        const subscription = watch((_, { name, type }) => {
            if (type !== 'change') return;

            const match = name?.match(/^samples\.(\d+)/);
            const changedIndex = match ? parseInt(match[1]) : undefined;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(async () => {
                const currentValues = getValues();
                const currentSnapshot = JSON.stringify(
                    changedIndex !== undefined
                        ? currentValues.samples[changedIndex]
                        : currentValues,
                );

                // Пропуск, если данные не изменились с последнего сохранения
                if (currentSnapshot === lastSnapshotRef.current) {
                    return;
                }

                setIsAutoSaving(true);
                try {
                    await handleSave(currentValues, false, changedIndex);
                    lastSnapshotRef.current = currentSnapshot;
                    setLastSavedTime(new Date());
                } catch (error) {
                    console.error('Auto-save error:', error);
                } finally {
                    setIsAutoSaving(false);
                }
            }, delay);
        });

        return () => {
            subscription.unsubscribe();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [watch, getValues, handleSave, delay]);

    return { isAutoSaving, lastSavedTime };
}
