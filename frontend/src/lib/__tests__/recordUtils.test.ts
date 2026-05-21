import { describe, it, expect } from 'vitest';
import { draftToRecordData, getSexAndLifestageFromField } from '@/lib/recordUtils';

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
        expect(result.specimens).toBeUndefined();
    });

    it('omits specimens when all quantity fields are zero', () => {
        const result = draftToRecordData({
            males: 0,
            females: 0,
            adults: 0,
        });
        expect(result.specimens).toBeUndefined();
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
            country: 'RU',
            region: 'Test Region',
            locality: 'Test Locality',
            verbatim_date: '2024-01-15',
            recorded_by: 'Ivanov',
        });

        expect(result.country).toBe('RU');
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
