import { useState, useCallback, useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormRecord, RecordFull, UpdateRecordResponse } from '@/types/api.dto';
import { useSaveRecord } from '@/hooks/useSaveRecord';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSyncRecordToForm } from '@/hooks/useSyncRecordToForm';
import { toFormPartial } from '@/lib/recordUtils';

const FORM_RECORD_FIELDS: (keyof FormRecord)[] = [
    'georef_source',
    'country',
    'region',
    'district',
    'locality',
    'is_manual_location',
    'verbatimcoordinates',
    'latitude',
    'longitude',
    'coordinate_uncertainty',
    'location_remarks',
    'verbatim_date',
    'date_precision',
    'is_interval',
    'habitat',
    'sampling_protocol',
    'sampling_effort',
    'sample_size_value',
    'sample_size_unit',
    'event_remarks',
    'field_number',
    'catalog_number',
    'collection_code',
    'recorded_by',
    'family',
    'genus',
    'species',
    'tax_verbatim',
    'taxon_rank',
    'type_status',
    'accepted_name',
    'taxon_remarks',
    'identification_remarks',
    'quantity_type',
    'occurrence_remarks',
    'males',
    'subadultMales',
    'females',
    'subadultFemales',
    'adults',
    'juveniles',
];

interface UseRecordFormOptions {
    activeRecordId: string;
    activeRecord?: RecordFull;
    methods: UseFormReturn<FormRecord>;
    publ_id: number;
    user_id: number;
    registerSave: (fn: (options?: { silent?: boolean }) => Promise<void>) => void;
}

interface UseRecordFormReturn {
    handleSave: () => Promise<void>;
    handleSubmit: () => Promise<void>;
    isSaving: boolean;
    isAutoSaving: boolean;
    lastSavedTime: Date | null;
    nonFieldErrors: string[];
}

export function useRecordForm({
    activeRecordId,
    activeRecord,
    methods,
    publ_id,
    user_id,
    registerSave,
}: UseRecordFormOptions): UseRecordFormReturn {
    const skipNextSyncRef = useRef(false);
    const lastErrorRecordRef = useRef<{ id: string; updatedAt: string } | null>(null);
    const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

    const {
        save: rawSave,
        submit: rawSubmit,
        isSaving,
        isSavingRef,
    } = useSaveRecord(activeRecordId, publ_id, user_id);

    const handleApiErrors = useCallback(
        (response: UpdateRecordResponse, silent?: boolean) => {
            if (
                lastErrorRecordRef.current?.id === response.record.id &&
                lastErrorRecordRef.current?.updatedAt === response.record.updated_at
            ) {
                return;
            }
            lastErrorRecordRef.current = {
                id: response.record.id,
                updatedAt: response.record.updated_at,
            };

            console.log('syncing errors!');
            methods.clearErrors();
            setNonFieldErrors([]);

            if (!response.errors || response.errors.length === 0) return;

            const nonField: string[] = [];

            for (const err of response.errors) {
                if (err.fields && err.fields.length > 0) {
                    for (const field of err.fields) {
                        const match = FORM_RECORD_FIELDS.find((f) => f === field);
                        if (match && !silent) {
                            methods.setError(match, {
                                type: 'server',
                                message: err.message,
                            });
                        }
                    }
                } else if (!silent) {
                    nonField.push(err.message);
                }
            }

            if (!silent && nonField.length > 0) {
                setNonFieldErrors(nonField);
            }
        },
        [methods],
    );

    const stableSave = useCallback(
        async (data: Partial<FormRecord>, options?: { silent?: boolean }): Promise<boolean> => {
            skipNextSyncRef.current = true;
            try {
                const response = await rawSave(data, options);
                if (response) handleApiErrors(response, options?.silent);
                return true;
            } catch {
                skipNextSyncRef.current = false;
                return false;
            }
        },
        [rawSave, handleApiErrors],
    );

    const stableSubmit = useCallback(
        async (data: Partial<FormRecord>): Promise<boolean> => {
            try {
                const response = await rawSubmit(data);
                if (response) handleApiErrors(response, false);
                return true;
            } catch {
                return false;
            }
        },
        [rawSubmit, handleApiErrors],
    );

    const { cancelPendingAutoSave } = useAutoSave({
        save: stableSave,
        methods,
        isSavingRef,
        onAutoSavingChange: setIsAutoSaving,
        onAutoSaved: setLastSavedTime,
    });

    const handleSave = useCallback(async () => {
        cancelPendingAutoSave();
        const ok = await stableSave(methods.getValues());
        if (ok) setLastSavedTime(new Date());
    }, [cancelPendingAutoSave, stableSave, methods, setLastSavedTime]);

    const handleSubmit = useCallback(async () => {
        cancelPendingAutoSave();
        await stableSubmit(methods.getValues());
    }, [cancelPendingAutoSave, stableSubmit, methods]);

    const syncCallback = useCallback(
        (record: RecordFull) => {
            if (skipNextSyncRef.current) {
                skipNextSyncRef.current = false;
                return;
            }
            console.log('syncing!');
            methods.reset(toFormPartial(record), {
                keepErrors: false,
                keepTouched: false,
                keepDirty: false,
            });
        },
        [methods],
    );

    useSyncRecordToForm(activeRecord, syncCallback);

    useEffect(() => {
        registerSave(async (options) => {
            cancelPendingAutoSave();
            const response = await rawSave(methods.getValues(), options);
            if (response) handleApiErrors(response, options?.silent);
        });
    }, [rawSave, methods, registerSave, handleApiErrors, cancelPendingAutoSave]);

    return {
        handleSave,
        handleSubmit,
        isSaving,
        isAutoSaving,
        lastSavedTime,
        nonFieldErrors,
    };
}
