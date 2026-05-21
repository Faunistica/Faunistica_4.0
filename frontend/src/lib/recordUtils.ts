import type { RecordData, FormRecord } from '@/types/api.dto';

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
    for (const key of fieldsToCopy) {
        const val = (draft as any)[key];
        if (val !== undefined) {
            if ((key === 'latitude' || key === 'longitude') && val !== null) {
                (data as any)[key] = String(val);
            } else {
                (data as any)[key] = val;
            }
        }
    }
    const specimens: any[] = [];
    const quantityFields = [
        'males',
        'subadultMales',
        'females',
        'subadultFemales',
        'adults',
        'juveniles',
    ] as const;
    for (const field of quantityFields) {
        const count = (draft as any)[field];
        if (count !== undefined && count !== null && count > 0) {
            const { sex, life_stage } = getSexAndLifestageFromField(field);
            specimens.push({ sex, life_stage, count });
        }
    }
    if (specimens.length > 0) {
        data.specimens = specimens;
    }
    return data;
};
