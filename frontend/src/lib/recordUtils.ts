import type { RecordData, RecordFull, FormRecord, Specimen } from '@/types/api.dto';
import type { QuantityField } from '@/types/forms';
import { FORM_SCALAR_FIELDS } from '@/types/forms';

const NULLISH_NUMBER_FIELDS = new Set<string>(['coordinate_uncertainty', 'sample_size_value']);

const SPECIMEN_FIELD_MAP: Array<{
    sex: Specimen['sex'];
    life_stage: Specimen['life_stage'];
    formField: QuantityField;
}> = [
    { sex: 'male', life_stage: 'adult', formField: 'males' },
    { sex: 'male', life_stage: 'subadult', formField: 'subadultMales' },
    { sex: 'female', life_stage: 'adult', formField: 'females' },
    { sex: 'female', life_stage: 'subadult', formField: 'subadultFemales' },
    { sex: 'none', life_stage: 'adult', formField: 'adults' },
    { sex: 'none', life_stage: 'juvenile', formField: 'juveniles' },
];

export const getSexAndLifestageFromField = (
    field: string,
): { sex: Specimen['sex']; life_stage: Specimen['life_stage'] } => {
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
    const data: RecordData = {
        country: null,
        region: null,
        district: null,
        locality: null,
        is_manual_location: null,
        latitude: null,
        longitude: null,
        verbatimcoordinates: null,
        coordinate_uncertainty: null,
        georef_source: null,
        location_remarks: null,
        verbatim_date: null,
        date_precision: null,
        is_interval: null,
        habitat: null,
        sampling_protocol: null,
        sampling_effort: null,
        sample_size_value: null,
        sample_size_unit: null,
        event_remarks: null,
        field_number: null,
        catalog_number: null,
        collection_code: null,
        recorded_by: null,
        family: null,
        genus: null,
        species: null,
        tax_verbatim: null,
        taxon_rank: null,
        type_status: null,
        accepted_name: null,
        taxon_remarks: null,
        quantity_type: null,
        specimens: null,
        occurrence_remarks: null,
        identification_remarks: null,
    };
    const d = draft as Record<string, unknown>;
    for (const key of FORM_SCALAR_FIELDS) {
        const val = d[key];
        if (val === undefined) continue;
        if (NULLISH_NUMBER_FIELDS.has(key) && val === 0) continue;
        if ((key === 'latitude' || key === 'longitude') && typeof val === 'number') {
            Object.assign(data, { [key]: String(val) });
        } else {
            Object.assign(data, { [key]: val });
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
    for (const [key, val] of Object.entries(record)) {
        if (key in SPECIMEN_FIELD_MAP || val == null) continue;
        result[key] = key === 'latitude' || key === 'longitude' ? Number(val) : val;
    }
    for (const mapping of SPECIMEN_FIELD_MAP) {
        const spec = record.specimens?.find(
            (s) => s.sex === mapping.sex && s.life_stage === mapping.life_stage,
        );
        if (spec?.count != null) {
            result[mapping.formField] = spec.count;
        }
    }
    return result as Partial<FormRecord>;
}
