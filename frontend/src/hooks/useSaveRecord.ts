import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { UseFormReturn } from 'react-hook-form';

import type { FormRecord } from '@/types/api.dto';
import { draftToRecordData } from '@/lib/recordUtils';
import { useEditRecordMutation, useSubmitRecordMutation } from '@/api/recordAPI';

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

interface UseSaveRecordReturn {
    save: (data: Partial<FormRecord>, options?: { silent?: boolean }) => Promise<void>;
    submit: (data: Partial<FormRecord>) => Promise<void>;
    isSaving: boolean;
    nonFieldErrors: string[];
    isSavingRef: React.MutableRefObject<boolean>;
}

export function useSaveRecord(
    activeRecordId: string | null,
    methods: UseFormReturn<FormRecord>,
    publ_id?: number,
    user_id?: number,
    cancelAutoSaveRef?: React.MutableRefObject<(() => void) | undefined>,
): UseSaveRecordReturn {
    const [editRecord] = useEditRecordMutation();
    const [submitRecord] = useSubmitRecordMutation();
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);
    const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);

    // Keep the ref in sync so useAutoSave can read it without re-rendering
    useEffect(() => {
        isSavingRef.current = isSaving;
    }, [isSaving]);

    const clearServerErrors = useCallback(() => {
        setNonFieldErrors([]);
        for (const field of FORM_RECORD_FIELDS) {
            methods.clearErrors(field);
        }
    }, [methods]);

    const handleResponse = useCallback(
        (
            _data: Partial<FormRecord>,
            response: { errors?: { fields: string[]; message: string }[] },
            silent?: boolean,
        ) => {
            clearServerErrors();

            if (!response.errors || response.errors.length === 0) return;

            const nonField: string[] = [];

            for (const err of response.errors) {
                if (err.fields && err.fields.length > 0) {
                    for (const field of err.fields) {
                        const match = FORM_RECORD_FIELDS.find((f) => f === field);
                        if (match) {
                            if (!silent) {
                                methods.setError(match, {
                                    type: 'server',
                                    message: err.message,
                                });
                            }
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
        [methods, clearServerErrors],
    );

    const save = useCallback(
        async (data: Partial<FormRecord>, options?: { silent?: boolean }) => {
            if (!activeRecordId) return;

            cancelAutoSaveRef?.current?.();

            setIsSaving(true);
            try {
                const payload = draftToRecordData(data);
                const response = await editRecord({
                    record_id: activeRecordId,
                    data: payload,
                    publ_id,
                    user_id,
                }).unwrap();
                handleResponse(data, response, options?.silent);
            } catch (error) {
                toast.error('Ошибка при сохранении данных');
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        [activeRecordId, editRecord, handleResponse, cancelAutoSaveRef, publ_id, user_id],
    );

    const submit = useCallback(
        async (data: Partial<FormRecord>) => {
            if (!activeRecordId) return;

            cancelAutoSaveRef?.current?.();

            setIsSaving(true);
            try {
                const payload = draftToRecordData(data);
                await editRecord({
                    record_id: activeRecordId,
                    data: payload,
                    publ_id,
                    user_id,
                }).unwrap();
                const response = await submitRecord({
                    record_id: activeRecordId,
                    data: payload,
                }).unwrap();
                handleResponse(data, response);
            } catch (error) {
                toast.error('Ошибка при отправке данных');
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        [activeRecordId, editRecord, submitRecord, handleResponse, cancelAutoSaveRef],
    );

    return { save, submit, isSaving, nonFieldErrors, isSavingRef };
}
