import type { UseFormReturn } from 'react-hook-form';
import type { FormRecord } from '@/types/api.dto';
import type { RecordValidationError } from '@/types/api.dto';

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

export function syncServerErrors(
    errors: RecordValidationError[],
    methods: UseFormReturn<FormRecord>,
): string[] {
    methods.clearErrors();

    const nonField: string[] = [];
    if (!errors?.length) return nonField;

    for (const err of errors) {
        if (err.fields && err.fields.length > 0) {
            let matched = false;
            for (const field of err.fields) {
                const match = FORM_RECORD_FIELDS.find((f) => f === field);
                if (match) {
                    methods.setError(match, {
                        type: 'server',
                        message: err.message,
                    });
                    matched = true;
                }
            }
            if (!matched) {
                nonField.push(err.message);
            }
        } else {
            nonField.push(err.message);
        }
    }

    return nonField;
}
