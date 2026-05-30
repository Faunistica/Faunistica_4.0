import { useState, useEffect, useRef } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import {
    convertDMToDD,
    convertDMSToDD,
    convertDDToDM,
    convertDDToDMS,
    formatDMVerbatim,
    formatDMSVerbatim,
} from '@/lib/geoUtils';
import type { FormRecord } from '@/types/api.dto';

type Axis = 'lat' | 'lng';
type Mode = 'dm' | 'dms';

type CoordinateParts<A extends Axis> = {
    degrees: number | '';
    minutes: number | '';
    seconds: number | '';
    direction: A extends 'lat' ? 'N' | 'S' : 'E' | 'W';
};

function deriveFromDD(dd: number, axis: 'lat', mode: Mode): CoordinateParts<'lat'>;
function deriveFromDD(dd: number, axis: 'lng', mode: Mode): CoordinateParts<'lng'>;
function deriveFromDD(dd: number, axis: Axis, mode: Mode): CoordinateParts<Axis> {
    if (mode === 'dm') {
        const result = axis === 'lat' ? convertDDToDM(dd, true) : convertDDToDM(dd, false);
        return {
            degrees: result.degrees,
            minutes: result.minutes,
            seconds: '',
            direction: result.direction,
        };
    }
    const result = axis === 'lat' ? convertDDToDMS(dd, true) : convertDDToDMS(dd, false);
    return {
        degrees: result.degrees,
        minutes: result.minutes,
        seconds: result.seconds,
        direction: result.direction,
    };
}

export function useCoordinateInputs(mode: 'dm'): {
    latitude: {
        degrees: { value: number | ''; onChange: (value: number | '') => void };
        minutes: { value: number | ''; onChange: (value: number | '') => void };
        direction: { value: 'N' | 'S'; onChange: (value: string) => void };
        error: string | undefined;
    };
    longitude: {
        degrees: { value: number | ''; onChange: (value: number | '') => void };
        minutes: { value: number | ''; onChange: (value: number | '') => void };
        direction: { value: 'E' | 'W'; onChange: (value: string) => void };
        error: string | undefined;
    };
};
export function useCoordinateInputs(mode: 'dms'): {
    latitude: {
        degrees: { value: number | ''; onChange: (value: number | '') => void };
        minutes: { value: number | ''; onChange: (value: number | '') => void };
        seconds: { value: number | ''; onChange: (value: number | '') => void };
        direction: { value: 'N' | 'S'; onChange: (value: string) => void };
        error: string | undefined;
    };
    longitude: {
        degrees: { value: number | ''; onChange: (value: number | '') => void };
        minutes: { value: number | ''; onChange: (value: number | '') => void };
        seconds: { value: number | ''; onChange: (value: number | '') => void };
        direction: { value: 'E' | 'W'; onChange: (value: string) => void };
        error: string | undefined;
    };
};
export function useCoordinateInputs(mode: Mode) {
    const { control } = useFormContext<FormRecord>();

    const { field: latField, fieldState: latFieldState } = useController({
        name: 'latitude',
        control,
    });
    const { field: lonField, fieldState: lonFieldState } = useController({
        name: 'longitude',
        control,
    });
    const { field: verbField } = useController({
        name: 'verbatimcoordinates',
        control,
    });

    const latRef = useRef<CoordinateParts<'lat'>>({
        degrees: '',
        minutes: '',
        seconds: '',
        direction: 'N',
    });
    const lonRef = useRef<CoordinateParts<'lng'>>({
        degrees: '',
        minutes: '',
        seconds: '',
        direction: 'E',
    });
    const [latParts, setLatParts] = useState<CoordinateParts<'lat'>>({
        degrees: '',
        minutes: '',
        seconds: '',
        direction: 'N',
    });
    const [lonParts, setLonParts] = useState<CoordinateParts<'lng'>>({
        degrees: '',
        minutes: '',
        seconds: '',
        direction: 'E',
    });

    const lastLatRef = useRef<number | null>(null);
    const lastLonRef = useRef<number | null>(null);

    // Mount init + external change detection
    useEffect(() => {
        if (latField.value !== lastLatRef.current) {
            lastLatRef.current = latField.value;
            const parts = deriveFromDD(latField.value, 'lat', mode);
            latRef.current = parts;
            setLatParts(parts);
        }
        if (lonField.value !== lastLonRef.current) {
            lastLonRef.current = lonField.value;
            const parts = deriveFromDD(lonField.value, 'lng', mode);
            lonRef.current = parts;
            setLonParts(parts);
        }
    }, [latField.value, lonField.value, mode]);

    const syncForm = () => {
        const latDegrees = latRef.current.degrees;
        const latMinutes = latRef.current.minutes;
        const latSeconds = latRef.current.seconds;
        const latDirection = latRef.current.direction;
        const lonDegrees = lonRef.current.degrees;
        const lonMinutes = lonRef.current.minutes;
        const lonSeconds = lonRef.current.seconds;
        const lonDirection = lonRef.current.direction;

        if (
            typeof latDegrees !== 'number' ||
            typeof latMinutes !== 'number' ||
            typeof lonDegrees !== 'number' ||
            typeof lonMinutes !== 'number'
        )
            return;
        if (mode === 'dms' && (typeof latSeconds !== 'number' || typeof lonSeconds !== 'number'))
            return;

        const newLatitude =
            mode === 'dm'
                ? convertDMToDD(latDegrees, latMinutes, latDirection)
                : convertDMSToDD(latDegrees, latMinutes, latSeconds, latDirection);
        const newLongitude =
            mode === 'dm'
                ? convertDMToDD(lonDegrees, lonMinutes, lonDirection)
                : convertDMSToDD(lonDegrees, lonMinutes, lonSeconds, lonDirection);
        const verbatim =
            mode === 'dm'
                ? formatDMVerbatim(
                      latDegrees,
                      latMinutes,
                      latDirection,
                      lonDegrees,
                      lonMinutes,
                      lonDirection,
                  )
                : formatDMSVerbatim(
                      latDegrees,
                      latMinutes,
                      latSeconds,
                      latDirection,
                      lonDegrees,
                      lonMinutes,
                      lonSeconds,
                      lonDirection,
                  );

        latField.onChange(newLatitude);
        lastLatRef.current = newLatitude;
        lonField.onChange(newLongitude);
        lastLonRef.current = newLongitude;
        verbField.onChange(verbatim);
    };

    const handleLatDegreesChange = (value: number | '') => {
        latRef.current.degrees = value;
        setLatParts((previous) => ({ ...previous, degrees: value }));
        syncForm();
    };

    const handleLatMinutesChange = (value: number | '') => {
        latRef.current.minutes = value;
        setLatParts((previous) => ({ ...previous, minutes: value }));
        syncForm();
    };

    const handleLatSecondsChange = (value: number | '') => {
        latRef.current.seconds = value;
        setLatParts((previous) => ({ ...previous, seconds: value }));
        syncForm();
    };

    const handleLatDirectionChange = (value: string) => {
        if (value !== 'N' && value !== 'S') return;
        latRef.current.direction = value;
        setLatParts((previous) => ({ ...previous, direction: value }));
        syncForm();
    };

    const handleLonDegreesChange = (value: number | '') => {
        lonRef.current.degrees = value;
        setLonParts((previous) => ({ ...previous, degrees: value }));
        syncForm();
    };

    const handleLonMinutesChange = (value: number | '') => {
        lonRef.current.minutes = value;
        setLonParts((previous) => ({ ...previous, minutes: value }));
        syncForm();
    };

    const handleLonSecondsChange = (value: number | '') => {
        lonRef.current.seconds = value;
        setLonParts((previous) => ({ ...previous, seconds: value }));
        syncForm();
    };

    const handleLonDirectionChange = (value: string) => {
        if (value !== 'E' && value !== 'W') return;
        lonRef.current.direction = value;
        setLonParts((previous) => ({ ...previous, direction: value }));
        syncForm();
    };

    if (mode === 'dm') {
        return {
            latitude: {
                degrees: { value: latParts.degrees, onChange: handleLatDegreesChange },
                minutes: { value: latParts.minutes, onChange: handleLatMinutesChange },
                direction: { value: latParts.direction, onChange: handleLatDirectionChange },
                error: latFieldState.error?.message,
            },
            longitude: {
                degrees: { value: lonParts.degrees, onChange: handleLonDegreesChange },
                minutes: { value: lonParts.minutes, onChange: handleLonMinutesChange },
                direction: { value: lonParts.direction, onChange: handleLonDirectionChange },
                error: lonFieldState.error?.message,
            },
        };
    }

    return {
        latitude: {
            degrees: { value: latParts.degrees, onChange: handleLatDegreesChange },
            minutes: { value: latParts.minutes, onChange: handleLatMinutesChange },
            seconds: { value: latParts.seconds, onChange: handleLatSecondsChange },
            direction: { value: latParts.direction, onChange: handleLatDirectionChange },
            error: latFieldState.error?.message,
        },
        longitude: {
            degrees: { value: lonParts.degrees, onChange: handleLonDegreesChange },
            minutes: { value: lonParts.minutes, onChange: handleLonMinutesChange },
            seconds: { value: lonParts.seconds, onChange: handleLonSecondsChange },
            direction: { value: lonParts.direction, onChange: handleLonDirectionChange },
            error: lonFieldState.error?.message,
        },
    };
}
