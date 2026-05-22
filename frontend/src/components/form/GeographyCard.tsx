import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Autocomplete from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';

import SavedPresetSelect from './SavedPresetSelect';

import 'leaflet/dist/leaflet.css';
import { type FC, useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Map as MapIcon, MapPin } from 'lucide-react';

import { GeographyMap } from '@/components/map/GeographyMap';
import { DMInputGroup, DMSInputGroup } from '@/components/map/CoordinateInputs';
import { GEOREF_OPTIONS, COUNTRY_OPTIONS, type FormSchema } from '@/types/forms';

import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useLazyGeoSearchQuery } from '@/api/utilAPI';

interface Props {
    index: number;
    publ_id: number;
}

const GeographyCard: FC<Props> = ({ index }) => {
    const {
        register,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useFormContext<FormSchema>();
    const prefix = `samples.${index}` as const;
    const err = errors.samples?.[index];

    const georefSource = watch(`${prefix}.georef_source`);
    const latValue = watch(`${prefix}.latitude`);
    const lonValue = watch(`${prefix}.longitude`);

    const isNone = !georefSource || georefSource === 'none';
    const isArticle = georefSource === 'lit';
    const isCustom = georefSource === 'vol';

    const [showMap, setShowMap] = useState(false);
    const [coordFormat, setCoordFormat] = useState<'DD' | 'DM' | 'DMS' | ''>('');

    useEffect(() => {
        if (isCustom) {
            setValue(`${prefix}.verbatimcoordinates` as any, null, { shouldValidate: true });
        }
    }, [isCustom, prefix, setValue]);

    // Reset local state when switching samples
    useEffect(() => {
        setShowMap(false);
        setCoordFormat('');
    }, [index]);

    const handleMapSelect = (lat: number, lng: number) => {
        setValue(`${prefix}.latitude` as any, lat, { shouldValidate: true });
        setValue(`${prefix}.longitude` as any, lng, { shouldValidate: true });
    };

    // ── Geo search queries ──
    const [searchRegion, { isFetching: regionLoading }] = useLazyGeoSearchQuery();
    const [searchDistrict, { isFetching: districtLoading }] = useLazyGeoSearchQuery();

    const [regionSuggestions, setRegionSuggestions] = useState<string[]>([]);
    const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([]);

    const handleRegionSearch = useDebouncedCallback(async (text: string) => {
        const result = await searchRegion({ field: 'region', text }).unwrap();
        setRegionSuggestions(result.suggestions ?? []);
    }, 300);

    const regionValue = watch(`${prefix}.region`);

    const handleDistrictSearch = useDebouncedCallback(async (text: string) => {
        const result = await searchDistrict({
            field: 'district',
            text,
            region: regionValue ?? undefined,
        }).unwrap();
        setDistrictSuggestions(result.suggestions ?? []);
    }, 300);

    return (
        <Card className="border-slate-200 shadow-sm">
            {/* ... CardHeader и блоки Административной географии ... */}
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <MapPin className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                        Пространственная локализация
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                <SavedPresetSelect type="location" currentIndex={index} />

                {/* ── Row 1: Coordinate origin + Remarks ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
                    <div className="space-y-3">
                        <Label className="font-medium">Происхождение координат</Label>
                        <Controller
                            name={`${prefix}.georef_source`}
                            // это лютый костыль, но без него не работает
                            defaultValue={'none'}
                            control={control}
                            render={({ field }) => (
                                <RadioGroup
                                    value={field.value ?? 'none'}
                                    onValueChange={field.onChange}
                                    className="space-y-2"
                                >
                                    {GEOREF_OPTIONS.map((opt) => (
                                        <div
                                            key={opt.value}
                                            className="flex items-center space-x-2"
                                        >
                                            <RadioGroupItem
                                                value={opt.value}
                                                id={`${prefix}_geo_${opt.value}`}
                                            />
                                            <Label
                                                htmlFor={`${prefix}_geo_${opt.value}`}
                                                className="font-normal text-slate-700 cursor-pointer"
                                            >
                                                {opt.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.location_remarks`}>
                            Географические примечания
                        </Label>
                        <Textarea
                            id={`${prefix}.location_remarks`}
                            className="h-28 resize-none"
                            placeholder="Примечания к местоположению…"
                            {...register(`${prefix}.location_remarks`)}
                        />
                    </div>
                </div>

                {/* ── Row 2: Administrative geography ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.country`}>Страна</Label>
                        <Controller
                            name={`${prefix}.country`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || undefined}
                                >
                                    <SelectTrigger
                                        id={`${prefix}.country`}
                                        className="w-full"
                                        aria-invalid={!!err?.country}
                                    >
                                        <SelectValue placeholder="Выберите страну" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.region`}>Регион (субъект)</Label>
                        <Controller
                            name={`${prefix}.region`}
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    id={`${prefix}.region`}
                                    value={field.value ?? ''}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        setValue(`${prefix}.is_manual_location`, true);
                                    }}
                                    onSearch={handleRegionSearch}
                                    suggestions={regionSuggestions}
                                    isLoading={regionLoading}
                                    placeholder="Начните вводить…"
                                    ariaInvalid={!!err?.region}
                                />
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.district`}>Район</Label>
                        <Controller
                            name={`${prefix}.district`}
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    id={`${prefix}.district`}
                                    value={field.value ?? ''}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        setValue(`${prefix}.is_manual_location`, true);
                                    }}
                                    onSearch={handleDistrictSearch}
                                    suggestions={districtSuggestions}
                                    isLoading={districtLoading}
                                    placeholder="Начните вводить…"
                                    ariaInvalid={!!err?.district}
                                />
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.locality`}>Локалитет (топоним)</Label>
                        <Input
                            id={`${prefix}.locality`}
                            placeholder="Исходное название места из статьи"
                            aria-invalid={!!err?.locality}
                            {...register(`${prefix}.locality`)}
                        />
                    </div>
                </div>

                {!isNone && (
                    <div className="border-t border-slate-100 pt-5 space-y-6">
                        {/* --- ВВОД ИЗ СТАТЬИ --- */}
                        {isArticle && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Формат ввода координат</Label>
                                        <Select
                                            value={coordFormat || undefined}
                                            onValueChange={(val: 'DD' | 'DM' | 'DMS') =>
                                                setCoordFormat(val)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите формат" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DD">
                                                    Десятичные градусы (DD)
                                                </SelectItem>
                                                <SelectItem value="DM">
                                                    Градусы и минуты (DM)
                                                </SelectItem>
                                                <SelectItem value="DMS">
                                                    Градусы, минуты, секунды (DMS)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* <div className="space-y-2">
                                        <Label htmlFor={`${prefix}.verbatimcoordinates`}>Исходная строка (verbatim)</Label>
                                        <Input
                                            id={`${prefix}.verbatimcoordinates`}
                                            placeholder="Соберется автоматически..."
                                            readOnly={coordFormat !== 'DD'} // Разрешаем ручной ввод только в DD
                                            className={coordFormat !== 'DD' ? "bg-slate-100 cursor-not-allowed" : ""}
                                            {...register(`${prefix}.verbatimcoordinates`)}
                                        />
                                    </div> */}
                                </div>

                                {/* Динамические поля ввода */}
                                {coordFormat === 'DM' && <DMInputGroup prefix={prefix} />}
                                {coordFormat === 'DMS' && <DMSInputGroup prefix={prefix} />}
                            </div>
                        )}

                        {/* --- РУЧНАЯ ГЕОПРИВЯЗКА (КАРТА) --- */}
                        {isCustom && (
                            <div className="space-y-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowMap(!showMap)}
                                >
                                    <MapIcon className="w-4 h-4 mr-2" />
                                    {showMap ? 'Скрыть карту' : 'Выбрать на карте'}
                                </Button>

                                {showMap && (
                                    <GeographyMap
                                        latitude={latValue}
                                        longitude={lonValue}
                                        onLocationSelect={handleMapSelect}
                                    />
                                )}
                            </div>
                        )}

                        {/* --- ОБЩИЕ ПОЛЯ DD (Отображаются всегда) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`${prefix}.latitude`}>Широта (DD)</Label>
                                <Input
                                    id={`${prefix}.latitude`}
                                    type="number"
                                    step="any"
                                    readOnly={isArticle && coordFormat !== 'DD'} // Блокируем если введены DM/DMS
                                    className={
                                        isArticle && coordFormat !== 'DD'
                                            ? 'bg-slate-100 cursor-not-allowed'
                                            : ''
                                    }
                                    aria-invalid={!!err?.latitude}
                                    {...register(`${prefix}.latitude` as any, {
                                        valueAsNumber: true,
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`${prefix}.longitude`}>Долгота (DD)</Label>
                                <Input
                                    id={`${prefix}.longitude`}
                                    type="number"
                                    step="any"
                                    readOnly={isArticle && coordFormat !== 'DD'}
                                    className={
                                        isArticle && coordFormat !== 'DD'
                                            ? 'bg-slate-100 cursor-not-allowed'
                                            : ''
                                    }
                                    aria-invalid={!!err?.longitude}
                                    {...register(`${prefix}.longitude` as any, {
                                        valueAsNumber: true,
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`${prefix}.coordinate_uncertainty`}>
                                    Неопределённость, м
                                </Label>
                                <Input
                                    id={`${prefix}.coordinate_uncertainty`}
                                    type="number"
                                    {...register(`${prefix}.coordinate_uncertainty` as any, {
                                        valueAsNumber: true,
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GeographyCard;
