import type { RecordData, DraftRecord, RecordFull } from '@/types/api.dto';
import type { RecordSchema, QuantityField } from '@/types/forms';

export const getFieldFromSexAndLifestage = (sex?: string | null, life_stage?: string | null): QuantityField | null => {
    if (sex === 'male' && life_stage === 'взрослые') return 'mmm';
    if (sex === 'male' && life_stage === 'субвзрослые') return 'ssm';
    if (sex === 'female' && life_stage === 'взрослые') return 'fff';
    if (sex === 'female' && life_stage === 'субвзрослые') return 'ssf';
    if ((sex === 'none' || !sex) && life_stage === 'взрослые') return 'adu';
    if ((sex === 'none' || !sex) && life_stage === 'ювенильные') return 'juv';
    return null;
};

export const getSexAndLifestageFromField = (field: string): { sex: string; life_stage: string } => {
    switch (field) {
        case 'mmm': return { sex: 'male', life_stage: 'взрослые' };
        case 'ssm': return { sex: 'male', life_stage: 'субвзрослые' };
        case 'fff': return { sex: 'female', life_stage: 'взрослые' };
        case 'ssf': return { sex: 'female', life_stage: 'субвзрослые' };
        case 'adu': return { sex: 'none', life_stage: 'взрослые' };
        case 'juv': return { sex: 'none', life_stage: 'ювенильные' };
        default: return { sex: 'none', life_stage: 'none' };
    }
};

/**
 * Groups flat API records (one per sex/lifestage) into DraftRecords
 * where each draft represents a single sample with multiple quantity fields.
 */
export const groupRecordsIntoDrafts = (records: RecordFull[]): DraftRecord[] => {
    const draftsMap = new Map<string, DraftRecord>();

    records.forEach(record => {
        // Create a hash for the combination of Location + Event + Taxon
        const hash = [
            record.country, record.region, record.district, record.locality,
            record.latitude, record.longitude, record.verbatim_date,
            record.habitat, record.sampling_protocol, record.recorded_by,
            record.family, record.genus, record.species, record.accepted_name,
        ].join('|');

        let draft = draftsMap.get(hash);
        if (!draft) {
            draft = {
                ...record,
                record_ids: {},
            };
            draftsMap.set(hash, draft);
        }

        const field = getFieldFromSexAndLifestage(record.sex, record.life_stage);
        if (field && record.quantity) {
            (draft as any)[field] = record.quantity;
            if (draft.record_ids) {
                draft.record_ids[field] = record.id;
            }
        } else {
            // Store as base record if it doesn't have a quantity yet
            if (draft.record_ids) {
                draft.record_ids['base'] = record.id;
            }
        }

        // Always take the latest metadata
        if (record.quantity_type) draft.quantity_type = record.quantity_type;
        if (record.occurrence_remarks) draft.occurrence_remarks = record.occurrence_remarks;
        if (record.identification_remarks) draft.identification_remarks = record.identification_remarks;
        if (record.georef_source) draft.georef_source = record.georef_source;
        if (record.taxon_rank) draft.taxon_rank = record.taxon_rank;
        if (record.type_status) draft.type_status = record.type_status;
        if (record.verbatimcoordinates) draft.verbatimcoordinates = record.verbatimcoordinates;
        if (record.coordinate_uncertainty) draft.coordinate_uncertainty = record.coordinate_uncertainty;
        if (record.location_remarks) draft.location_remarks = record.location_remarks;
        if (record.taxon_remarks) draft.taxon_remarks = record.taxon_remarks;
    });

    return Array.from(draftsMap.values());
};

/**
 * Convert a form DraftRecord back to the flat RecordData shape expected by the API.
 * Strips quantity fields and record_ids – caller handles those separately.
 */
export const draftToRecordData = (draft: Partial<RecordSchema>, publ_id: number): RecordData => {
    const data: RecordData = { publ_id };

    // Copy all string/number/boolean fields that exist in RecordData
    const fieldsToCopy: (keyof RecordData)[] = [
        'country', 'region', 'district', 'locality', 'is_manual_location',
        'latitude', 'longitude', 'verbatimcoordinates', 'coordinate_uncertainty',
        'georef_source', 'location_remarks',
        'verbatim_date', 'date_precision', 'is_interval',
        'habitat', 'sampling_protocol', 'sampling_effort',
        'sample_size_value', 'sample_size_unit',
        'event_remarks', 'field_number', 'catalog_number', 'collection_code',
        'recorded_by',
        'family', 'genus', 'species', 'tax_verbatim', 'taxon_rank',
        'type_status', 'accepted_name', 'taxon_remarks',
        'quantity_type', 'occurrence_remarks', 'identification_remarks',
    ];

    for (const key of fieldsToCopy) {
        const val = (draft as any)[key];
        if (val !== undefined) {
            (data as any)[key] = val;
        }
    }

    return data;
};
