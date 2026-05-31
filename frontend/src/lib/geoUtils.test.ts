import { describe, it, expect } from 'vitest';
import { convertToDD, convertToDM, convertToDMS, formatCoordinatesVerbatim } from './geoUtils';

describe('convertToDD', () => {
    it('converts N hemisphere', () => {
        expect(convertToDD({ degrees: 50, minutes: 30, seconds: '', direction: 'N' }, 'dm')).toBe(
            50.5,
        );
    });

    it('converts S hemisphere to negative', () => {
        expect(convertToDD({ degrees: 50, minutes: 30, seconds: '', direction: 'S' }, 'dm')).toBe(
            -50.5,
        );
    });

    it('converts E hemisphere', () => {
        expect(convertToDD({ degrees: 30, minutes: 15, seconds: '', direction: 'E' }, 'dm')).toBe(
            30.25,
        );
    });

    it('converts W hemisphere to negative', () => {
        expect(convertToDD({ degrees: 30, minutes: 15, seconds: '', direction: 'W' }, 'dm')).toBe(
            -30.25,
        );
    });

    it('handles zero', () => {
        expect(convertToDD({ degrees: 0, minutes: 0, seconds: '', direction: 'N' }, 'dm')).toBe(0);
    });

    it('rounds to 6 decimal places', () => {
        expect(
            convertToDD({ degrees: 50, minutes: 30.123456, seconds: '', direction: 'N' }, 'dm'),
        ).toBe(50.502058);
    });

    it('converts N hemisphere', () => {
        expect(convertToDD({ degrees: 50, minutes: 30, seconds: 36, direction: 'N' }, 'dms')).toBe(
            50.51,
        );
    });

    it('converts S hemisphere to negative', () => {
        expect(convertToDD({ degrees: 50, minutes: 30, seconds: 36, direction: 'S' }, 'dms')).toBe(
            -50.51,
        );
    });

    it('handles zero', () => {
        expect(convertToDD({ degrees: 0, minutes: 0, seconds: 0, direction: 'N' }, 'dms')).toBe(0);
    });
});

describe('formatCoordinatesVerbatim', () => {
    it('formats DM coordinates', () => {
        expect(
            formatCoordinatesVerbatim(
                { degrees: 50, minutes: 30, seconds: '', direction: 'N' },
                { degrees: 30, minutes: 15, seconds: '', direction: 'E' },
                'dm',
            ),
        ).toBe("50° 30' N, 30° 15' E");
    });
    it('formats DMS coordinates', () => {
        expect(
            formatCoordinatesVerbatim(
                { degrees: 50, minutes: 30, seconds: 36, direction: 'N' },
                { degrees: 30, minutes: 15, seconds: 0, direction: 'E' },
                'dms',
            ),
        ).toBe("50° 30' 36'' N, 30° 15' 0'' E");
    });
});

describe('convertDDToDM', () => {
    it('converts positive lat to N', () => {
        expect(convertToDM(50.5, 'lat')).toEqual({
            degrees: 50,
            minutes: 30,
            seconds: '',
            direction: 'N',
        });
    });

    it('converts negative lat to S', () => {
        expect(convertToDM(-50.5, 'lat')).toEqual({
            degrees: 50,
            minutes: 30,
            seconds: '',
            direction: 'S',
        });
    });

    it('converts positive lon to E', () => {
        expect(convertToDM(30.25, 'lon')).toEqual({
            degrees: 30,
            minutes: 15,
            seconds: '',
            direction: 'E',
        });
    });

    it('converts negative lon to W', () => {
        expect(convertToDM(-30.25, 'lon')).toEqual({
            degrees: 30,
            minutes: 15,
            seconds: '',
            direction: 'W',
        });
    });

    it('handles zero', () => {
        expect(convertToDM(0, 'lat')).toEqual({
            degrees: 0,
            minutes: 0,
            seconds: '',
            direction: 'N',
        });
    });
});

describe('convertDDToDMS', () => {
    it('converts positive lat to N', () => {
        expect(convertToDMS(50.51, 'lat')).toEqual({
            degrees: 50,
            minutes: 30,
            seconds: 36,
            direction: 'N',
        });
    });

    it('converts negative lat to S', () => {
        expect(convertToDMS(-50.51, 'lat')).toEqual({
            degrees: 50,
            minutes: 30,
            seconds: 36,
            direction: 'S',
        });
    });

    it('handles zero', () => {
        expect(convertToDMS(0, 'lat')).toEqual({
            degrees: 0,
            minutes: 0,
            seconds: 0,
            direction: 'N',
        });
    });
});
