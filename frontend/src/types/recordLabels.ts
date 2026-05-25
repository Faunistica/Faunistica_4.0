import type { RecordFull, FormRecord } from '@/types/api.dto';

type SharedField = keyof RecordFull & keyof FormRecord;

export const LOCATION_FIELDS: SharedField[] = [
    'country',
    'region',
    'district',
    'locality',
    'georef_source',
    'latitude',
    'longitude',
    'coordinate_uncertainty',
    'verbatimcoordinates',
    'location_remarks',
    'is_manual_location',
];

export const EVENT_FIELDS: SharedField[] = [
    'verbatim_date',
    'habitat',
    'recorded_by',
    'date_precision',
    'is_interval',
    'sampling_protocol',
    'sampling_effort',
    'sample_size_value',
    'sample_size_unit',
    'event_remarks',
    'field_number',
    'catalog_number',
    'collection_code',
];

export function locationSummary(record: RecordFull): string {
    return [record.country, record.region, record.district, record.locality]
        .filter(Boolean)
        .join(', ');
}

export function eventSummary(record: RecordFull): string {
    return [record.verbatim_date, record.habitat?.slice(0, 30), record.recorded_by]
        .filter(Boolean)
        .join(' · ');
}
