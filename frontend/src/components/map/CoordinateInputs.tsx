import { type FC, useState, useEffect, useCallback, useRef, memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { convertDMToDD, convertDMSToDD, formatDMVerbatim, formatDMSVerbatim } from '@/lib/geoUtils';
import type { FormSchema } from '@/types/forms';

interface Props {
    prefix: string;
    disabled?: boolean;
}

// Хук для дебаунса значений
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// Вспомогательный компонент для ввода градусов/минут/секунд
const CoordinateInput = memo(
    ({
        value,
        onChange,
        min,
        max,
        step,
        placeholder,
        id,
        error,
        disabled,
    }: {
        value: number | '';
        onChange: (val: number | '') => void;
        min: number;
        max: number;
        step?: number;
        placeholder: string;
        id: string;
        error?: string;
        disabled?: boolean;
    }) => {
        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                onChange(val ? Number(val) : '');
            },
            [onChange],
        );

        return (
            <div className="flex-1">
                <Input
                    id={id}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={error ? 'border-red-500' : ''}
                />
                {error && <span className="text-xs text-red-500 mt-0.5 block">{error}</span>}
            </div>
        );
    },
);
CoordinateInput.displayName = 'CoordinateInput';

// Вспомогательный компонент для выбора направления
const DirectionSelect = memo(
    ({
        value,
        onChange,
        options,
        id,
        disabled,
    }: {
        value: string;
        onChange: (val: string) => void;
        options: { value: string; label: string }[];
        id: string;
        disabled?: boolean;
    }) => {
        return (
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger id={id} className="w-[80px] shrink-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    },
);
DirectionSelect.displayName = 'DirectionSelect';

export const DMInputGroup: FC<Props> = memo(({ prefix, disabled }) => {
    const {
        setValue,
        trigger,
        formState: { errors },
    } = useFormContext<FormSchema>();

    const [latDeg, setLatDeg] = useState<number | ''>('');
    const [latMin, setLatMin] = useState<number | ''>('');
    const [latDir, setLatDir] = useState<'N' | 'S'>('N');
    const [lonDeg, setLonDeg] = useState<number | ''>('');
    const [lonMin, setLonMin] = useState<number | ''>('');
    const [lonDir, setLonDir] = useState<'E' | 'W'>('E');

    // Дебаунсим значения перед записью в форму (300ms)
    const debouncedValues = useDebounce({ latDeg, latMin, latDir, lonDeg, lonMin, lonDir }, 300);
    const prevValuesRef = useRef<string>('');

    const updateFormValues = useCallback(() => {
        const { latDeg, latMin, latDir, lonDeg, lonMin, lonDir } = debouncedValues;

        // Пропускаем, если не все поля заполнены
        if (latDeg === '' || latMin === '' || lonDeg === '' || lonMin === '') {
            return;
        }

        // Создаем уникальный ключ для отслеживания изменений
        const currentKey = `${latDeg}-${latMin}-${latDir}-${lonDeg}-${lonMin}-${lonDir}`;
        if (prevValuesRef.current === currentKey) {
            return;
        }
        prevValuesRef.current = currentKey;

        // Вычисляем значения
        const latitude = convertDMToDD(latDeg, latMin, latDir);
        const longitude = convertDMToDD(lonDeg, lonMin, lonDir);
        const verbatim = formatDMVerbatim(latDeg, latMin, latDir, lonDeg, lonMin, lonDir);

        // Обновляем форму БЕЗ лишних триггеров валидации на каждом чихе
        setValue(`${prefix}.latitude`, latitude, {
            shouldValidate: false,
            shouldDirty: true,
        });
        setValue(`${prefix}.longitude`, longitude, {
            shouldValidate: false,
            shouldDirty: true,
        });
        setValue(`${prefix}.verbatimcoordinates`, verbatim, {
            shouldValidate: false,
            shouldDirty: true,
        });

        // Запускаем валидацию асинхронно, чтобы не блокировать ввод
        setTimeout(() => {
            trigger([`${prefix}.latitude`, `${prefix}.longitude`]);
        }, 0);
    }, [debouncedValues, prefix, setValue, trigger]);

    useEffect(() => {
        updateFormValues();
    }, [updateFormValues]);

    // Обработчики с мемоизацией
    const handleLatDegChange = useCallback((val: number | '') => setLatDeg(val), []);
    const handleLatMinChange = useCallback((val: number | '') => setLatMin(val), []);
    const handleLatDirChange = useCallback((val: 'N' | 'S') => setLatDir(val), []);
    const handleLonDegChange = useCallback((val: number | '') => setLonDeg(val), []);
    const handleLonMinChange = useCallback((val: number | '') => setLonMin(val), []);
    const handleLonDirChange = useCallback((val: 'E' | 'W') => setLonDir(val), []);

    // Ошибки из react-hook-form
    const latError = errors[prefix]?.latitude?.message as string | undefined;
    const lonError = errors[prefix]?.longitude?.message as string | undefined;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 rounded-lg border border-slate-200">
            {/* Широта */}
            <div className="space-y-2">
                <Label htmlFor={`lat-deg-${prefix}`}>Широта (градусы° минуты')</Label>
                <div className="flex gap-2 items-start">
                    <CoordinateInput
                        id={`lat-deg-${prefix}`}
                        value={latDeg}
                        onChange={handleLatDegChange}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-min-${prefix}`}
                        value={latMin}
                        onChange={handleLatMinChange}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lat-dir-${prefix}`}
                        value={latDir}
                        onChange={handleLatDirChange}
                        options={[
                            { value: 'N', label: 'N (С.Ш.)' },
                            { value: 'S', label: 'S (Ю.Ш.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Долгота */}
            <div className="space-y-2">
                <Label htmlFor={`lon-deg-${prefix}`}>Долгота (градусы° минуты')</Label>
                <div className="flex gap-2 items-start">
                    <CoordinateInput
                        id={`lon-deg-${prefix}`}
                        value={lonDeg}
                        onChange={handleLonDegChange}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={lonError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-min-${prefix}`}
                        value={lonMin}
                        onChange={handleLonMinChange}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lon-dir-${prefix}`}
                        value={lonDir}
                        onChange={handleLonDirChange}
                        options={[
                            { value: 'E', label: 'E (В.Д.)' },
                            { value: 'W', label: 'W (З.Д.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
});
DMInputGroup.displayName = 'DMInputGroup';

export const DMSInputGroup: FC<Props> = memo(({ prefix, disabled }) => {
    const {
        setValue,
        trigger,
        formState: { errors },
    } = useFormContext<FormSchema>();

    const [latDeg, setLatDeg] = useState<number | ''>('');
    const [latMin, setLatMin] = useState<number | ''>('');
    const [latSec, setLatSec] = useState<number | ''>('');
    const [latDir, setLatDir] = useState<'N' | 'S'>('N');
    const [lonDeg, setLonDeg] = useState<number | ''>('');
    const [lonMin, setLonMin] = useState<number | ''>('');
    const [lonSec, setLonSec] = useState<number | ''>('');
    const [lonDir, setLonDir] = useState<'E' | 'W'>('E');

    const debouncedValues = useDebounce(
        {
            latDeg,
            latMin,
            latSec,
            latDir,
            lonDeg,
            lonMin,
            lonSec,
            lonDir,
        },
        300,
    );
    const prevValuesRef = useRef<string>('');

    const updateFormValues = useCallback(() => {
        const { latDeg, latMin, latSec, latDir, lonDeg, lonMin, lonSec, lonDir } = debouncedValues;

        if (
            latDeg === '' ||
            latMin === '' ||
            latSec === '' ||
            lonDeg === '' ||
            lonMin === '' ||
            lonSec === ''
        ) {
            return;
        }

        const currentKey = `${latDeg}-${latMin}-${latSec}-${latDir}-${lonDeg}-${lonMin}-${lonSec}-${lonDir}`;
        if (prevValuesRef.current === currentKey) {
            return;
        }
        prevValuesRef.current = currentKey;

        const latitude = convertDMSToDD(latDeg, latMin, latSec, latDir);
        const longitude = convertDMSToDD(lonDeg, lonMin, lonSec, lonDir);
        // Verbatim рассчитывает    ся и сохраняется, но НИГДЕ не рендерится
        const verbatim = formatDMSVerbatim(
            latDeg,
            latMin,
            latSec,
            latDir,
            lonDeg,
            lonMin,
            lonSec,
            lonDir,
        );

        setValue(`${prefix}.latitude`, latitude, {
            shouldValidate: false,
            shouldDirty: true,
        });
        setValue(`${prefix}.longitude`, longitude, {
            shouldValidate: false,
            shouldDirty: true,
        });
        setValue(`${prefix}.verbatimcoordinates`, verbatim, {
            shouldValidate: false,
            shouldDirty: true,
        });

        setTimeout(() => {
            trigger([`${prefix}.latitude`, `${prefix}.longitude`]);
        }, 0);
    }, [debouncedValues, prefix, setValue, trigger]);

    useEffect(() => {
        updateFormValues();
    }, [updateFormValues]);

    const handleLatDegChange = useCallback((val: number | '') => setLatDeg(val), []);
    const handleLatMinChange = useCallback((val: number | '') => setLatMin(val), []);
    const handleLatSecChange = useCallback((val: number | '') => setLatSec(val), []);
    const handleLatDirChange = useCallback((val: 'N' | 'S') => setLatDir(val), []);
    const handleLonDegChange = useCallback((val: number | '') => setLonDeg(val), []);
    const handleLonMinChange = useCallback((val: number | '') => setLonMin(val), []);
    const handleLonSecChange = useCallback((val: number | '') => setLonSec(val), []);
    const handleLonDirChange = useCallback((val: 'E' | 'W') => setLonDir(val), []);

    const latError = errors[prefix]?.latitude?.message as string | undefined;
    const lonError = errors[prefix]?.longitude?.message as string | undefined;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 rounded-lg border border-slate-200">
            {/* Широта */}
            <div className="space-y-2">
                <Label htmlFor={`lat-deg-dms-${prefix}`}>Широта (градусы° минуты' секунды'')</Label>
                <div className="flex gap-2 items-start flex-wrap">
                    <CoordinateInput
                        id={`lat-deg-dms-${prefix}`}
                        value={latDeg}
                        onChange={handleLatDegChange}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-min-dms-${prefix}`}
                        value={latMin}
                        onChange={handleLatMinChange}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-sec-dms-${prefix}`}
                        value={latSec}
                        onChange={handleLatSecChange}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lat-dir-dms-${prefix}`}
                        value={latDir}
                        onChange={handleLatDirChange}
                        options={[
                            { value: 'N', label: 'N (С.Ш.)' },
                            { value: 'S', label: 'S (Ю.Ш.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Долгота */}
            <div className="space-y-2">
                <Label htmlFor={`lon-deg-dms-${prefix}`}>
                    Долгота (градусы° минуты' секунды'')
                </Label>
                <div className="flex gap-2 items-start flex-wrap">
                    <CoordinateInput
                        id={`lon-deg-dms-${prefix}`}
                        value={lonDeg}
                        onChange={handleLonDegChange}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={lonError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-min-dms-${prefix}`}
                        value={lonMin}
                        onChange={handleLonMinChange}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-sec-dms-${prefix}`}
                        value={lonSec}
                        onChange={handleLonSecChange}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lon-dir-dms-${prefix}`}
                        value={lonDir}
                        onChange={handleLonDirChange}
                        options={[
                            { value: 'E', label: 'E (В.Д.)' },
                            { value: 'W', label: 'W (З.Д.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
});
DMSInputGroup.displayName = 'DMSInputGroup';
