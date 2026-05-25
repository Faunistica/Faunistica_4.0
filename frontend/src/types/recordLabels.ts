export const LOCATION_FIELDS = ['country', 'region', 'district', 'locality'] as const;

export const EVENT_FIELDS = ['verbatim_date', 'habitat', 'recorded_by'] as const;

import type { RecordFull } from '@/types/api.dto';

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
