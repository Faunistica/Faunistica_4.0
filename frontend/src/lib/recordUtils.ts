import type { RecordData, RecordFull, FormRecord, Specimen } from '@/types/api.dto';

export const getSexAndLifestageFromField = (field: string): { sex: string; life_stage: string } => {
    switch (field) {
        case 'males':
            return { sex: 'male', life_stage: 'adult' };
        case 'subadultMales':
            return { sex: 'male', life_stage: 'subadult' };
        case 'females':
            return { sex: 'female', life_stage: 'adult' };
        case 'subadultFemales':
            return { sex: 'female', life_stage: 'subadult' };
        case 'adults':
            return { sex: 'none', life_stage: 'adult' };
        case 'juveniles':
            return { sex: 'none', life_stage: 'juvenile' };
        default:
            return { sex: 'none', life_stage: 'none' };
    }
};

export const draftToRecordData = (draft: Partial<FormRecord>): RecordData => {
    const data: RecordData = {};
    const fieldsToCopy: (keyof RecordData)[] = [
        'country',
        'region',
        'district',
        'locality',
        'is_manual_location',
        'latitude',
        'longitude',
        'verbatimcoordinates',
        'coordinate_uncertainty',
        'georef_source',
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
        'quantity_type',
        'occurrence_remarks',
        'identification_remarks',
    ];
    const d = draft as Record<string, unknown>;
    for (const key of fieldsToCopy) {
        const val = d[key];
        if (val !== undefined) {
            if ((key === 'latitude' || key === 'longitude') && typeof val === 'number') {
                Object.assign(data, { [key]: String(val) });
            } else {
                Object.assign(data, { [key]: val });
            }
        }
    }
    const specimens: Specimen[] = [];
    const quantityFields = [
        'males',
        'subadultMales',
        'females',
        'subadultFemales',
        'adults',
        'juveniles',
    ] as const;
    const d3 = draft as Record<string, unknown>;
    for (const field of quantityFields) {
        const count = d3[field];
        if (typeof count === 'number' && count > 0) {
            const { sex, life_stage } = getSexAndLifestageFromField(field);
            specimens.push({ sex, life_stage, count });
        }
    }
    if (specimens.length > 0) {
        data.specimens = specimens;
    }
    return data;
};

export function toFormPartial(record: RecordFull): Partial<FormRecord> {
    const result: Record<string, unknown> = {};
    const keys: (keyof RecordData)[] = [
        'country',
        'region',
        'district',
        'locality',
        'is_manual_location',
        'latitude',
        'longitude',
        'verbatimcoordinates',
        'coordinate_uncertainty',
        'georef_source',
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
    ];
    for (const key of keys) {
        const val = record[key];
        if (val !== undefined && val !== null) {
            if (key === 'latitude' || key === 'longitude') {
                result[key] = Number(val);
            } else {
                result[key] = val;
            }
        }
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return result as Partial<FormRecord>;
}
