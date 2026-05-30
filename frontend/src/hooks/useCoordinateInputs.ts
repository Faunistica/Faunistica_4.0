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

type Mode = 'dm' | 'dms';

function deriveFromDD(
    dd: number,
    isLat: true,
    mode: Mode,
): { degrees: number; minutes: number; seconds: number | undefined; direction: 'N' | 'S' };
function deriveFromDD(
    dd: number,
    isLat: false,
    mode: Mode,
): { degrees: number; minutes: number; seconds: number | undefined; direction: 'E' | 'W' };
function deriveFromDD(dd: number, isLat: boolean, mode: Mode) {
    if (mode === 'dm') {
        const r = isLat ? convertDDToDM(dd, true) : convertDDToDM(dd, false);
        return {
            degrees: r.degrees,
            minutes: r.minutes,
            direction: r.direction,
            seconds: undefined,
        };
    }
    const r = isLat ? convertDDToDMS(dd, true) : convertDDToDMS(dd, false);
    return { degrees: r.degrees, minutes: r.minutes, seconds: r.seconds, direction: r.direction };
}

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

    const [latDeg, setLatDeg] = useState<number | ''>('');
    const [latMin, setLatMin] = useState<number | ''>('');
    const [latSec, setLatSec] = useState<number | ''>('');
    const [latDir, setLatDir] = useState<'N' | 'S'>('N');
    const [lonDeg, setLonDeg] = useState<number | ''>('');
    const [lonMin, setLonMin] = useState<number | ''>('');
    const [lonSec, setLonSec] = useState<number | ''>('');
    const [lonDir, setLonDir] = useState<'E' | 'W'>('E');

    const ref = useRef<{
        latDeg?: number;
        latMin?: number;
        latSec?: number;
        latDir: 'N' | 'S';
        lonDeg?: number;
        lonMin?: number;
        lonSec?: number;
        lonDir: 'E' | 'W';
    }>({ latDir: 'N', lonDir: 'E' });

    const lastLatRef = useRef<number | null>(null);
    const lastLonRef = useRef<number | null>(null);

    const syncRefs = () => {
        ref.current.latDeg = latDeg === '' ? undefined : latDeg;
        ref.current.latMin = latMin === '' ? undefined : latMin;
        ref.current.latSec = latSec === '' ? undefined : latSec;
        ref.current.latDir = latDir;
        ref.current.lonDeg = lonDeg === '' ? undefined : lonDeg;
        ref.current.lonMin = lonMin === '' ? undefined : lonMin;
        ref.current.lonSec = lonSec === '' ? undefined : lonSec;
        ref.current.lonDir = lonDir;
    };
    syncRefs();

    // Mount init + external change detection
    useEffect(() => {
        if (latField.value !== lastLatRef.current) {
            lastLatRef.current = latField.value;
            const d = deriveFromDD(latField.value, true, mode);
            setLatDeg(d.degrees);
            setLatMin(d.minutes);
            setLatDir(d.direction);
            // oxlint-disable-next-line react-hooks-js/set-state-in-effect
            if (mode === 'dms') setLatSec(d.seconds ?? 0);
        }
        if (lonField.value !== lastLonRef.current) {
            lastLonRef.current = lonField.value;
            const d = deriveFromDD(lonField.value, false, mode);
            setLonDeg(d.degrees);
            setLonMin(d.minutes);
            setLonDir(d.direction);
            if (mode === 'dms') setLonSec(d.seconds ?? 0);
        }
    }, [latField.value, lonField.value, mode]);

    const syncForm = () => {
        const {
            latDeg: ld,
            latMin: lm,
            latSec: ls,
            latDir: lad,
            lonDeg: lnd,
            lonMin: lnm,
            lonSec: lns,
            lonDir: lod,
        } = ref.current;
        if (ld === undefined || lm === undefined || lnd === undefined || lnm === undefined) return;
        if (mode === 'dms' && (ls === undefined || lns === undefined)) return;

        const latitude =
            mode === 'dm' ? convertDMToDD(ld, lm, lad) : convertDMSToDD(ld, lm, ls!, lad);
        const longitude =
            mode === 'dm' ? convertDMToDD(lnd, lnm, lod) : convertDMSToDD(lnd, lnm, lns!, lod);
        const verbatim =
            mode === 'dm'
                ? formatDMVerbatim(ld, lm, lad, lnd, lnm, lod)
                : formatDMSVerbatim(ld, lm, ls!, lad, lnd, lnm, lns!, lod);

        latField.onChange(latitude);
        lastLatRef.current = latitude;
        lonField.onChange(longitude);
        lastLonRef.current = longitude;
        verbField.onChange(verbatim);
    };

    const handleLatDegChange = (val: number | '') => {
        ref.current.latDeg = val === '' ? undefined : val;
        setLatDeg(val);
        syncForm();
    };

    const handleLatMinChange = (val: number | '') => {
        ref.current.latMin = val === '' ? undefined : val;
        setLatMin(val);
        syncForm();
    };

    const handleLatSecChange = (val: number | '') => {
        ref.current.latSec = val === '' ? undefined : val;
        setLatSec(val);
        syncForm();
    };

    const handleLatDirChange = (val: string) => {
        if (val !== 'N' && val !== 'S') return;
        ref.current.latDir = val;
        setLatDir(val);
        syncForm();
    };

    const handleLonDegChange = (val: number | '') => {
        ref.current.lonDeg = val === '' ? undefined : val;
        setLonDeg(val);
        syncForm();
    };

    const handleLonMinChange = (val: number | '') => {
        ref.current.lonMin = val === '' ? undefined : val;
        setLonMin(val);
        syncForm();
    };

    const handleLonSecChange = (val: number | '') => {
        ref.current.lonSec = val === '' ? undefined : val;
        setLonSec(val);
        syncForm();
    };

    const handleLonDirChange = (val: string) => {
        if (val !== 'E' && val !== 'W') return;
        ref.current.lonDir = val;
        setLonDir(val);
        syncForm();
    };

    return {
        latitude: {
            degrees: latDeg,
            minutes: latMin,
            seconds: latSec,
            direction: latDir,
            setDegrees: handleLatDegChange,
            setMinutes: handleLatMinChange,
            setSeconds: handleLatSecChange,
            setDirection: handleLatDirChange,
            error: latFieldState.error?.message,
        },
        longitude: {
            degrees: lonDeg,
            minutes: lonMin,
            seconds: lonSec,
            direction: lonDir,
            setDegrees: handleLonDegChange,
            setMinutes: handleLonMinChange,
            setSeconds: handleLonSecChange,
            setDirection: handleLonDirChange,
            error: lonFieldState.error?.message,
        },
    };
}
