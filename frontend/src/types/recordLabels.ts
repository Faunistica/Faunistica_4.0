import type { RecordFull, FormRecord } from '@/types/api.dto';

type SharedField = keyof RecordFull & keyof FormRecord;

export const LOCATION_FIELDS: SharedField[] = ['country', 'region', 'district', 'locality'];

export const EVENT_FIELDS: SharedField[] = ['verbatim_date', 'habitat', 'recorded_by'];

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
