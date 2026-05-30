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

function deriveFromDD(dd: number, isLat: boolean, mode: Mode) {
    if (mode === 'dm') {
        const r = isLat ? convertDDToDM(dd, true) : convertDDToDM(dd, false);
        return {
            degrees: r.degrees,
            minutes: r.minutes,
            direction: r.direction,
            seconds: undefined as number | undefined,
        };
    }
    const r = isLat ? convertDDToDMS(dd, true) : convertDDToDMS(dd, false);
    return {
        degrees: r.degrees,
        minutes: r.minutes,
        seconds: r.seconds,
        direction: r.direction,
    };
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

    // Refs mirror state so handlers always read latest values (no stale closures)
    const ref = useRef({
        latDeg: '' as number | '',
        latMin: '' as number | '',
        latSec: '' as number | '',
        latDir: 'N' as 'N' | 'S',
        lonDeg: '' as number | '',
        lonMin: '' as number | '',
        lonSec: '' as number | '',
        lonDir: 'E' as 'E' | 'W',
    });

    const lastLatRef = useRef(latField.value);
    const lastLonRef = useRef(lonField.value);

    const syncRefs = () => {
        ref.current.latDeg = latDeg;
        ref.current.latMin = latMin;
        ref.current.latSec = latSec;
        ref.current.latDir = latDir;
        ref.current.lonDeg = lonDeg;
        ref.current.lonMin = lonMin;
        ref.current.lonSec = lonSec;
        ref.current.lonDir = lonDir;
    };
    syncRefs();

    // Mount: initialize local state from existing form values
    useEffect(() => {
        const lat = deriveFromDD(latField.value, true, mode);
        setLatDeg(lat.degrees);
        setLatMin(lat.minutes);
        setLatDir(lat.direction as 'N' | 'S');
        if (mode === 'dms') setLatSec(lat.seconds!);

        const lon = deriveFromDD(lonField.value, false, mode);
        setLonDeg(lon.degrees);
        setLonMin(lon.minutes);
        setLonDir(lon.direction as 'E' | 'W');
        if (mode === 'dms') setLonSec(lon.seconds!);

        lastLatRef.current = latField.value;
        lastLonRef.current = lonField.value;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // External change detection: latitude
    useEffect(() => {
        if (latField.value !== lastLatRef.current) {
            lastLatRef.current = latField.value;
            const d = deriveFromDD(latField.value, true, mode);
            setLatDeg(d.degrees);
            setLatMin(d.minutes);
            setLatDir(d.direction as 'N' | 'S');
            if (mode === 'dms') setLatSec(d.seconds!);
        }
    }, [latField.value, mode]);

    // External change detection: longitude
    useEffect(() => {
        if (lonField.value !== lastLonRef.current) {
            lastLonRef.current = lonField.value;
            const d = deriveFromDD(lonField.value, false, mode);
            setLonDeg(d.degrees);
            setLonMin(d.minutes);
            setLonDir(d.direction as 'E' | 'W');
            if (mode === 'dms') setLonSec(d.seconds!);
        }
    }, [lonField.value, mode]);

    const writeAll = () => {
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
        if (ld === '' || lm === '' || lnd === '' || lnm === '') return;
        if (mode === 'dms' && (ls === '' || lns === '')) return;

        const latitude =
            mode === 'dm' ? convertDMToDD(ld, lm, lad) : convertDMSToDD(ld, lm, ls, lad);
        const longitude =
            mode === 'dm' ? convertDMToDD(lnd, lnm, lod) : convertDMSToDD(lnd, lnm, lns, lod);
        const verbatim =
            mode === 'dm'
                ? formatDMVerbatim(ld, lm, lad, lnd, lnm, lod)
                : formatDMSVerbatim(ld, lm, ls, lad, lnd, lnm, lns, lod);

        latField.onChange(latitude);
        lastLatRef.current = latitude;
        lonField.onChange(longitude);
        lastLonRef.current = longitude;
        verbField.onChange(verbatim);
    };

    const handleLatDegChange = (val: number | '') => {
        ref.current.latDeg = val;
        setLatDeg(val);
        writeAll();
    };

    const handleLatMinChange = (val: number | '') => {
        ref.current.latMin = val;
        setLatMin(val);
        writeAll();
    };

    const handleLatSecChange = (val: number | '') => {
        ref.current.latSec = val;
        setLatSec(val);
        writeAll();
    };

    const handleLatDirChange = (val: string) => {
        if (val !== 'N' && val !== 'S') return;
        ref.current.latDir = val;
        setLatDir(val);
        writeAll();
    };

    const handleLonDegChange = (val: number | '') => {
        ref.current.lonDeg = val;
        setLonDeg(val);
        writeAll();
    };

    const handleLonMinChange = (val: number | '') => {
        ref.current.lonMin = val;
        setLonMin(val);
        writeAll();
    };

    const handleLonSecChange = (val: number | '') => {
        ref.current.lonSec = val;
        setLonSec(val);
        writeAll();
    };

    const handleLonDirChange = (val: string) => {
        if (val !== 'E' && val !== 'W') return;
        ref.current.lonDir = val;
        setLonDir(val);
        writeAll();
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
