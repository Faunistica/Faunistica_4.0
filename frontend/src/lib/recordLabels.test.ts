import { describe, it, expect } from 'vitest';
import { locationSummary, eventSummary } from './recordLabels';
import type { RecordFull } from '@/types/api.dto';

function makeRecord(overrides: Partial<RecordFull> = {}): RecordFull {
    return {
        id: 'rec-1',
        publ_id: 1,
        user_id: 1,
        errors: null,
        type: 'rec_ok',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        ip: null,
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
        identification_remarks: null,
        quantity_type: null,
        specimens: null,
        occurrence_remarks: null,
        ...overrides,
    };
}

describe('locationSummary', () => {
    it('joins non-empty fields with comma', () => {
        const record = makeRecord({ country: 'Россия', region: 'Tatarstan', locality: 'Kazan' });
        expect(locationSummary(record)).toBe('Россия, Tatarstan, Kazan');
    });

    it('filters out empty fields', () => {
        const record = makeRecord({ country: 'Россия', region: '', district: '', locality: '' });
        expect(locationSummary(record)).toBe('Россия');
    });

    it('returns empty string when all fields empty', () => {
        const record = makeRecord();
        expect(locationSummary(record)).toBe('');
    });

    it('includes district when present', () => {
        const record = makeRecord({
            country: 'Россия',
            region: 'Tatarstan',
            district: 'Zelenodolsky',
            locality: 'Kazan',
        });
        expect(locationSummary(record)).toBe('Россия, Tatarstan, Zelenodolsky, Kazan');
    });
});

describe('eventSummary', () => {
    it('joins fields with middle dot', () => {
        const record = makeRecord({
            verbatim_date: '2024-01-15',
            habitat: 'Forest edge',
            recorded_by: 'Ivanov',
        });
        expect(eventSummary(record)).toBe('2024-01-15 · Forest edge · Ivanov');
    });

    it('truncates habitat to 30 characters', () => {
        const longHabitat = 'A'.repeat(50);
        const record = makeRecord({
            verbatim_date: '2024-01-15',
            habitat: longHabitat,
            recorded_by: 'Ivanov',
        });
        expect(eventSummary(record)).toBe('2024-01-15 · AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA · Ivanov');
        expect(eventSummary(record)).toHaveLength(52); // 10 + 3 + 30 + 3 + 6
    });

    it('filters out null fields', () => {
        const record = makeRecord({ verbatim_date: '2024-01-15' });
        expect(eventSummary(record)).toBe('2024-01-15');
    });

    it('returns empty string when all fields null', () => {
        const record = makeRecord();
        expect(eventSummary(record)).toBe('');
    });
});
