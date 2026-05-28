import { describe, it, expect } from 'vitest';
import { convertDMToDD, convertDMSToDD, convertDDToDM, convertDDToDMS, formatDMVerbatim, formatDMSVerbatim } from './geoUtils';

describe('convertDMToDD', () => {
    it('converts N hemisphere', () => {
        expect(convertDMToDD(50, 30, 'N')).toBe(50.5);
    });

    it('converts S hemisphere to negative', () => {
        expect(convertDMToDD(50, 30, 'S')).toBe(-50.5);
    });

    it('converts E hemisphere', () => {
        expect(convertDMToDD(30, 15, 'E')).toBe(30.25);
    });

    it('converts W hemisphere to negative', () => {
        expect(convertDMToDD(30, 15, 'W')).toBe(-30.25);
    });

    it('handles zero', () => {
        expect(convertDMToDD(0, 0, 'N')).toBe(0);
    });

    it('rounds to 6 decimal places', () => {
        expect(convertDMToDD(50, 30.123456, 'N')).toBe(50.502058);
    });
});

describe('convertDMSToDD', () => {
    it('converts N hemisphere', () => {
        expect(convertDMSToDD(50, 30, 36, 'N')).toBe(50.51);
    });

    it('converts S hemisphere to negative', () => {
        expect(convertDMSToDD(50, 30, 36, 'S')).toBe(-50.51);
    });

    it('handles zero', () => {
        expect(convertDMSToDD(0, 0, 0, 'N')).toBe(0);
    });
});

describe('formatDMVerbatim', () => {
    it('formats DM coordinates', () => {
        expect(formatDMVerbatim(50, 30, 'N', 30, 15, 'E')).toBe("50° 30' N, 30° 15' E");
    });
});

describe('formatDMSVerbatim', () => {
    it('formats DMS coordinates', () => {
        expect(formatDMSVerbatim(50, 30, 36, 'N', 30, 15, 0, 'E')).toBe("50° 30' 36'' N, 30° 15' 0'' E");
    });
});

describe('convertDDToDM', () => {
    it('converts positive lat to N', () => {
        expect(convertDDToDM(50.5, true)).toEqual({ degrees: 50, minutes: 30, direction: 'N' });
    });

    it('converts negative lat to S', () => {
        expect(convertDDToDM(-50.5, true)).toEqual({ degrees: 50, minutes: 30, direction: 'S' });
    });

    it('converts positive lon to E', () => {
        expect(convertDDToDM(30.25, false)).toEqual({ degrees: 30, minutes: 15, direction: 'E' });
    });

    it('converts negative lon to W', () => {
        expect(convertDDToDM(-30.25, false)).toEqual({ degrees: 30, minutes: 15, direction: 'W' });
    });

    it('handles zero', () => {
        expect(convertDDToDM(0, true)).toEqual({ degrees: 0, minutes: 0, direction: 'N' });
    });
});

describe('convertDDToDMS', () => {
    it('converts positive lat to N', () => {
        expect(convertDDToDMS(50.51, true)).toEqual({ degrees: 50, minutes: 30, seconds: 36, direction: 'N' });
    });

    it('converts negative lat to S', () => {
        expect(convertDDToDMS(-50.51, true)).toEqual({ degrees: 50, minutes: 30, seconds: 36, direction: 'S' });
    });

    it('handles zero', () => {
        expect(convertDDToDMS(0, true)).toEqual({ degrees: 0, minutes: 0, seconds: 0, direction: 'N' });
    });
});
