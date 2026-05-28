import { useState, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { convertDMToDD, convertDMSToDD, formatDMVerbatim, formatDMSVerbatim } from '@/lib/geoUtils';
import type { FormRecord } from '@/types/api.dto';

type Mode = 'dm' | 'dms';

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

export function useCoordinateInputs(prefix: string, mode: Mode) {
  const { setValue, trigger, formState: { errors } } = useFormContext<FormRecord>();

  const [latDeg, setLatDeg] = useState<number | ''>('');
  const [latMin, setLatMin] = useState<number | ''>('');
  const [latSec, setLatSec] = useState<number | ''>('');
  const [latDir, setLatDir] = useState<'N' | 'S'>('N');
  const [lonDeg, setLonDeg] = useState<number | ''>('');
  const [lonMin, setLonMin] = useState<number | ''>('');
  const [lonSec, setLonSec] = useState<number | ''>('');
  const [lonDir, setLonDir] = useState<'E' | 'W'>('E');

  const prevValuesRef = useRef<string>('');

  const updateForm = useCallback(() => {
    if (mode === 'dm') {
      if (latDeg === '' || latMin === '' || lonDeg === '' || lonMin === '') return;

      const currentKey = `${latDeg}-${latMin}-${latDir}-${lonDeg}-${lonMin}-${lonDir}`;
      if (prevValuesRef.current === currentKey) return;
      prevValuesRef.current = currentKey;

      const latitude = convertDMToDD(latDeg, latMin, latDir);
      const longitude = convertDMToDD(lonDeg, lonMin, lonDir);
      const verbatim = formatDMVerbatim(latDeg, latMin, latDir, lonDeg, lonMin, lonDir);

      const latField = 'latitude' as const;
      const lonField = 'longitude' as const;
      const verbField = 'verbatimcoordinates' as const;

      setValue(latField, latitude, { shouldValidate: false, shouldDirty: true });
      setValue(lonField, longitude, { shouldValidate: false, shouldDirty: true });
      setValue(verbField, verbatim, { shouldValidate: false, shouldDirty: true });

      setTimeout(() => { void trigger([latField, lonField]); }, 0);
    } else {
      if (latDeg === '' || latMin === '' || latSec === '' || lonDeg === '' || lonMin === '' || lonSec === '') return;

      const currentKey = `${latDeg}-${latMin}-${latSec}-${latDir}-${lonDeg}-${lonMin}-${lonSec}-${lonDir}`;
      if (prevValuesRef.current === currentKey) return;
      prevValuesRef.current = currentKey;

      const latitude = convertDMSToDD(latDeg, latMin, latSec, latDir);
      const longitude = convertDMSToDD(lonDeg, lonMin, lonSec, lonDir);
      const verbatim = formatDMSVerbatim(latDeg, latMin, latSec, latDir, lonDeg, lonMin, lonSec, lonDir);

      const latField = 'latitude' as const;
      const lonField = 'longitude' as const;
      const verbField = 'verbatimcoordinates' as const;

      setValue(latField, latitude, { shouldValidate: false, shouldDirty: true });
      setValue(lonField, longitude, { shouldValidate: false, shouldDirty: true });
      setValue(verbField, verbatim, { shouldValidate: false, shouldDirty: true });

      setTimeout(() => { void trigger([latField, lonField]); }, 0);
    }
  }, [latDeg, latMin, latSec, latDir, lonDeg, lonMin, lonSec, lonDir, setValue, trigger, mode]);

  const { fn: debouncedUpdate } = useDebouncedCallback(updateForm, 300);

  const handleLatDegChange = useCallback((val: number | '') => { setLatDeg(val); debouncedUpdate(); }, [debouncedUpdate]);
  const handleLatMinChange = useCallback((val: number | '') => { setLatMin(val); debouncedUpdate(); }, [debouncedUpdate]);
  const handleLatSecChange = useCallback((val: number | '') => { setLatSec(val); debouncedUpdate(); }, [debouncedUpdate]);
  const handleLatDirChange = useCallback((val: string) => { if (val === 'N' || val === 'S') setLatDir(val); debouncedUpdate(); }, [debouncedUpdate]);
  const handleLonDegChange = useCallback((val: number | '') => { setLonDeg(val); debouncedUpdate(); }, [debouncedUpdate]);
  const handleLonMinChange = useCallback((val: number | '') => { setLonMin(val); debouncedUpdate(); }, [debouncedUpdate]);
  const handleLonSecChange = useCallback((val: number | '') => { setLonSec(val); debouncedUpdate(); }, [debouncedUpdate]);
  const handleLonDirChange = useCallback((val: string) => { if (val === 'E' || val === 'W') setLonDir(val); debouncedUpdate(); }, [debouncedUpdate]);

  const errorsAny = errors as Record<string, unknown>;
  const errVal = errorsAny[prefix];
  const errPrefix = isRecord(errVal) ? errVal : undefined;
  const latError = errPrefix && isRecord(errPrefix.latitude)
    ? (errPrefix.latitude as { message?: string }).message
    : undefined;
  const lonError = errPrefix && isRecord(errPrefix.longitude)
    ? (errPrefix.longitude as { message?: string }).message
    : undefined;

  return {
    latDeg, latMin, latSec, latDir,
    lonDeg, lonMin, lonSec, lonDir,
    setLatDeg: handleLatDegChange,
    setLatMin: handleLatMinChange,
    setLatSec: handleLatSecChange,
    setLatDir: handleLatDirChange,
    setLonDeg: handleLonDegChange,
    setLonMin: handleLonMinChange,
    setLonSec: handleLonSecChange,
    setLonDir: handleLonDirChange,
    latError, lonError,
  };
}
