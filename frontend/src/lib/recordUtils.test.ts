import { describe, it, expect } from 'vitest';
import { draftToRecordData, getSexAndLifestageFromField, toFormPartial } from '@/lib/recordUtils';
import type { RecordFull } from '@/types/api.dto';

describe('getSexAndLifestageFromField', () => {
    it('maps males to male adult', () => {
        expect(getSexAndLifestageFromField('males')).toEqual({ sex: 'male', life_stage: 'adult' });
    });

    it('maps subadultMales to male subadult', () => {
        expect(getSexAndLifestageFromField('subadultMales')).toEqual({
            sex: 'male',
            life_stage: 'subadult',
        });
    });

    it('maps females to female adult', () => {
        expect(getSexAndLifestageFromField('females')).toEqual({
            sex: 'female',
            life_stage: 'adult',
        });
    });

    it('maps subadultFemales to female subadult', () => {
        expect(getSexAndLifestageFromField('subadultFemales')).toEqual({
            sex: 'female',
            life_stage: 'subadult',
        });
    });

    it('maps adults to none adult', () => {
        expect(getSexAndLifestageFromField('adults')).toEqual({ sex: 'none', life_stage: 'adult' });
    });

    it('maps juveniles to none juvenile', () => {
        expect(getSexAndLifestageFromField('juveniles')).toEqual({
            sex: 'none',
            life_stage: 'juvenile',
        });
    });

    it('returns none/none for unknown field', () => {
        expect(getSexAndLifestageFromField('unknown')).toEqual({ sex: 'none', life_stage: 'none' });
    });
});

describe('draftToRecordData', () => {
    it('converts all six quantity fields to specimens', () => {
        const result = draftToRecordData({
            males: 3,
            subadultMales: 2,
            females: 5,
            subadultFemales: 1,
            adults: 4,
            juveniles: 6,
        });

        expect(result.specimens).toEqual([
            { sex: 'male', life_stage: 'adult', count: 3 },
            { sex: 'male', life_stage: 'subadult', count: 2 },
            { sex: 'female', life_stage: 'adult', count: 5 },
            { sex: 'female', life_stage: 'subadult', count: 1 },
            { sex: 'none', life_stage: 'adult', count: 4 },
            { sex: 'none', life_stage: 'juvenile', count: 6 },
        ]);
    });

    it('omits specimens when all quantity fields are undefined', () => {
        const result = draftToRecordData({});
        expect(result.specimens).toBeNull();
    });

    it('omits specimens when all quantity fields are zero', () => {
        const result = draftToRecordData({
            males: 0,
            females: 0,
            adults: 0,
        });
        expect(result.specimens).toBeNull();
    });

    it('includes only non-zero quantity fields', () => {
        const result = draftToRecordData({
            males: 10,
            females: 0,
            adults: undefined,
            juveniles: 5,
        });

        expect(result.specimens).toEqual([
            { sex: 'male', life_stage: 'adult', count: 10 },
            { sex: 'none', life_stage: 'juvenile', count: 5 },
        ]);
    });

    it('copies text fields from draft to record data', () => {
        const result = draftToRecordData({
            country: 'Россия',
            region: 'Test Region',
            locality: 'Test Locality',
            verbatim_date: '2024-01-15',
            recorded_by: 'Ivanov',
        });

        expect(result.country).toBe('Россия');
        expect(result.region).toBe('Test Region');
        expect(result.locality).toBe('Test Locality');
        expect(result.verbatim_date).toBe('2024-01-15');
        expect(result.recorded_by).toBe('Ivanov');
    });

    it('converts latitude and longitude to strings', () => {
        const result = draftToRecordData({
            latitude: 55.5,
            longitude: 37.2,
        });

        expect(result.latitude).toBe('55.5');
        expect(result.longitude).toBe('37.2');
    });
});

describe('toFormPartial', () => {
    const baseRecord: RecordFull = {
        id: 'rec-1',
        publ_id: 1,
        user_id: 1,
        errors: null,
        type: 'rec_ok',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        ip: null,
        country: 'Россия',
        region: 'Test Region',
        district: 'Test District',
        locality: 'Test Locality',
        is_manual_location: null,
        latitude: '55.5',
        longitude: '37.2',
        verbatimcoordinates: null,
        coordinate_uncertainty: null,
        georef_source: 'lit',
        location_remarks: 'Some notes',
        verbatim_date: '2024-01-15',
        date_precision: null,
        is_interval: null,
        habitat: null,
        sampling_protocol: 'Protocol A',
        sampling_effort: null,
        sample_size_value: null,
        sample_size_unit: null,
        event_remarks: null,
        field_number: null,
        catalog_number: null,
        collection_code: null,
        recorded_by: 'Ivanov',
        family: 'Canidae',
        genus: 'Canis',
        species: 'lupus',
        tax_verbatim: null,
        taxon_rank: null,
        type_status: null,
        accepted_name: null,
        taxon_remarks: null,
        identification_remarks: null,
        quantity_type: null,
        specimens: null,
        occurrence_remarks: null,
    };

    it('includes all scalar fields including nulls', () => {
        const result = toFormPartial(baseRecord);

        expect(result.country).toBe('Россия');
        expect(result.region).toBe('Test Region');
        expect(result.latitude).toBe(55.5);
        expect(result.longitude).toBe(37.2);
        expect(result.is_manual_location).toBe(false);
        expect(result.verbatimcoordinates).toBe(null);
        expect(result.coordinate_uncertainty).toBe(0);
        expect(result.date_precision).toBe('');
    });

    it('fills null fields with default values', () => {
        const record = { ...baseRecord, location_remarks: null, habitat: null };
        const result = toFormPartial(record);

        expect(result.location_remarks).toBe('');
        expect(result.habitat).toBe('');
    });

    it('maps specimens to quantity form fields', () => {
        const record: RecordFull = {
            ...baseRecord,
            specimens: [
                { sex: 'male', life_stage: 'adult', count: 3 },
                { sex: 'female', life_stage: 'adult', count: 5 },
                { sex: 'none', life_stage: 'juvenile', count: 6 },
            ],
        };

        const result = toFormPartial(record);

        expect(result.males).toBe(3);
        expect(result.females).toBe(5);
        expect(result.juveniles).toBe(6);
        // Fields without matching specimens are set to 0
        expect(result.subadultMales).toBe(0);
        expect(result.subadultFemales).toBe(0);
        expect(result.adults).toBe(0);
    });

    it('maps all six specimen types', () => {
        const record: RecordFull = {
            ...baseRecord,
            specimens: [
                { sex: 'male', life_stage: 'adult', count: 1 },
                { sex: 'male', life_stage: 'subadult', count: 2 },
                { sex: 'female', life_stage: 'adult', count: 3 },
                { sex: 'female', life_stage: 'subadult', count: 4 },
                { sex: 'none', life_stage: 'adult', count: 5 },
                { sex: 'none', life_stage: 'juvenile', count: 6 },
            ],
        };

        const result = toFormPartial(record);

        expect(result.males).toBe(1);
        expect(result.subadultMales).toBe(2);
        expect(result.females).toBe(3);
        expect(result.subadultFemales).toBe(4);
        expect(result.adults).toBe(5);
        expect(result.juveniles).toBe(6);
    });

    it('handles null specimens by setting all count fields to 0', () => {
        const record = { ...baseRecord, specimens: null };
        const result = toFormPartial(record);

        expect(result.males).toBe(0);
        expect(result.females).toBe(0);
        expect(result.subadultMales).toBe(0);
        expect(result.subadultFemales).toBe(0);
        expect(result.adults).toBe(0);
        expect(result.juveniles).toBe(0);
    });

    it('preserves quantity_type', () => {
        const record = { ...baseRecord, quantity_type: 'individuals' };
        const result = toFormPartial(record);

        expect(result.quantity_type).toBe('individuals');
    });

    it('fills quantity_type with default when null', () => {
        const record = { ...baseRecord, quantity_type: null };
        const result = toFormPartial(record);

        expect(result.quantity_type).toBe('');
    });

    it('includes required blocking fields', () => {
        const result = toFormPartial(baseRecord);

        expect(result.country).toBe('Россия');
        expect(result.region).toBe('Test Region');
        expect(result.district).toBe('Test District');
        expect(result.locality).toBe('Test Locality');
        expect(result.verbatim_date).toBe('2024-01-15');
        expect(result.sampling_protocol).toBe('Protocol A');
        expect(result.recorded_by).toBe('Ivanov');
        expect(result.family).toBe('Canidae');
        expect(result.genus).toBe('Canis');
        expect(result.species).toBe('lupus');
    });

    it('fills all form fields with defaults when RecordData is all null', () => {
        const empty: RecordFull = {
            id: 'rec-1',
            publ_id: 1,
            user_id: 1,
            errors: null,
            type: 'check_fail',
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
        };

        const result = toFormPartial(empty);

        // All RecordForm keys present with default values
        expect(result.country).toBe('');
        expect(result.locality).toBe('');
        expect(result.family).toBe('');
        expect(result.latitude).toBe(0);
        expect(result.longitude).toBe(0);
        expect(result.is_manual_location).toBe(false);
        expect(result.males).toBe(0);
    });
});
