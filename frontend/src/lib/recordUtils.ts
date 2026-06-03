import type { RecordData, RecordFull, Specimen } from '@/types/api.dto';
import type { QuantityField } from '@/lib/constants';
import { QUANTITY_FIELDS } from '@/lib/constants';
import { FORM_DEFAULT_VALUES, type RecordForm } from '@/types/forms';

const RECORD_FORM_KEYS = new Set(Object.keys(FORM_DEFAULT_VALUES));

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

export const draftToRecordData = (draft: Partial<RecordForm>): RecordData => {
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
    for (const [key, val] of Object.entries(draft)) {
        if (key in QUANTITY_FIELDS || val == null) continue;
        if (val === undefined) continue;
        if (NULLISH_NUMBER_FIELDS.has(key) && val === 0) continue;
        if ((key === 'latitude' || key === 'longitude') && typeof val === 'number') {
            Object.assign(data, { [key]: String(val) });
        } else {
            Object.assign(data, { [key]: val });
        }
    }
    const specimens: Specimen[] = [];
    for (const field of QUANTITY_FIELDS) {
        const count = draft[field];
        // Handle both numbers and strings (HTML inputs return strings)
        const numCount = typeof count === 'string' ? parseFloat(count) : count;
        if (typeof numCount === 'number' && !isNaN(numCount) && numCount > 0) {
            const { sex, life_stage } = getSexAndLifestageFromField(field);
            specimens.push({ sex, life_stage, count: numCount });
        }
    }
    if (specimens.length > 0) {
        data.specimens = specimens;
    }
    return data;
};

export function toFormPartial(record: RecordFull): Partial<RecordForm> {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(record)) {
        if (!RECORD_FORM_KEYS.has(key)) continue;
        if (val == null) continue;
        result[key] = key === 'latitude' || key === 'longitude' ? Number(val) : val;
    }
    for (const mapping of SPECIMEN_FIELD_MAP) {
        const spec = record.specimens?.find(
            (s) => s.sex === mapping.sex && s.life_stage === mapping.life_stage,
        );
        const numCount = typeof spec?.count === 'string' ? parseFloat(spec.count) : spec?.count;
        if (numCount != null && !isNaN(numCount)) {
            result[mapping.formField] = numCount;
        } else {
            result[mapping.formField] = 0;
        }
    }
    return result as Partial<RecordForm>;
}
