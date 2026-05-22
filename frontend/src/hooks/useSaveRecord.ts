import { useState, useCallback } from 'react';
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
    save: (data: Partial<FormRecord>) => Promise<void>;
    submit: (data: Partial<FormRecord>) => Promise<void>;
    isSaving: boolean;
    nonFieldErrors: string[];
}

export function useSaveRecord(
    activeRecordId: string | null,
    methods: UseFormReturn<FormRecord>,
): UseSaveRecordReturn {
    const [editRecord] = useEditRecordMutation();
    const [submitRecord] = useSubmitRecordMutation();
    const [isSaving, setIsSaving] = useState(false);
    const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);

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
        ) => {
            clearServerErrors();

            if (!response.errors || response.errors.length === 0) return;

            const nonField: string[] = [];

            for (const err of response.errors) {
                if (err.fields && err.fields.length > 0) {
                    for (const field of err.fields) {
                        const match = FORM_RECORD_FIELDS.find((f) => f === field);
                        if (match) {
                            methods.setError(match, {
                                type: 'server',
                                message: err.message,
                            });
                        }
                    }
                } else {
                    nonField.push(err.message);
                }
            }

            if (nonField.length > 0) {
                setNonFieldErrors(nonField);
            }
        },
        [methods, clearServerErrors],
    );

    const save = useCallback(
        async (data: Partial<FormRecord>) => {
            if (!activeRecordId) return;

            setIsSaving(true);
            try {
                const payload = draftToRecordData(data);
                const response = await editRecord({
                    record_id: activeRecordId,
                    data: payload,
                }).unwrap();
                handleResponse(data, response);
            } catch (error) {
                toast.error('Ошибка при сохранении данных');
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        [activeRecordId, editRecord, handleResponse],
    );

    const submit = useCallback(
        async (data: Partial<FormRecord>) => {
            if (!activeRecordId) return;

            setIsSaving(true);
            try {
                const payload = draftToRecordData(data);
                await editRecord({
                    record_id: activeRecordId,
                    data: payload,
                }).unwrap();
                const response = await submitRecord({
                    record_id: activeRecordId,
                }).unwrap();
                handleResponse(data, response);
            } catch (error) {
                toast.error('Ошибка при отправке данных');
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        [activeRecordId, editRecord, submitRecord, handleResponse],
    );

    return { save, submit, isSaving, nonFieldErrors };
}
