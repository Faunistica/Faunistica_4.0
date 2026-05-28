import { describe, it, expect } from 'vitest';
import { convertDMToDD, convertDMSToDD, formatDMVerbatim, formatDMSVerbatim } from './geoUtils';

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
