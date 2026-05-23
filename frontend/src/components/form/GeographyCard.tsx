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
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { FormAutocomplete } from '@/components/form/FormAutocomplete';
import { Button } from '@/components/ui/button';

// oxlint-disable-next-line import/no-unassigned-import
import 'leaflet/dist/leaflet.css';
import { type FC, useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Map as MapIcon, MapPin } from 'lucide-react';

import { GeographyMap } from '@/components/map/GeographyMap';
import { DMInputGroup, DMSInputGroup } from '@/components/map/CoordinateInputs';
import { GEOREF_OPTIONS, COUNTRY_OPTIONS } from '@/types/forms';
import type { FormRecord } from '@/types/api.dto';

import { useLazyGeoSearchQuery } from '@/api/utilAPI';

interface Props {
    publ_id: number;
}

const GeographyCard: FC<Props> = () => {
    const {
        register,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useFormContext<FormRecord>();

    const georefSource = watch('georef_source');
    const latValue = watch('latitude');
    const lonValue = watch('longitude');

    const isNone = !georefSource || georefSource === 'none';
    const isArticle = georefSource === 'lit';
    const isCustom = georefSource === 'vol';

    const [showMap, setShowMap] = useState(false);
    const [coordFormat, setCoordFormat] = useState<'DD' | 'DM' | 'DMS' | ''>('');

    useEffect(() => {
        if (isCustom) {
            setValue('verbatimcoordinates' as const, null, {
                shouldValidate: true,
            });
        }
    }, [isCustom, setValue]);

    const handleMapSelect = (lat: number, lng: number) => {
        setValue('latitude' as const, lat, { shouldValidate: true });
        setValue('longitude' as const, lng, { shouldValidate: true });
    };

    const handleAutocompleteChange = () => {
        setValue('is_manual_location', true);
    };

    const [searchRegion] = useLazyGeoSearchQuery();
    const [searchDistrict] = useLazyGeoSearchQuery();

    const regionSearchFn = (text: string) =>
        searchRegion({ field: 'region', text }).unwrap()
            .then((r) => r.suggestions ?? []);

    const districtSearchFn = (text: string) =>
        searchDistrict({ field: 'district', text }).unwrap()
            .then((r) => r.suggestions ?? []);

    return (
        <Card className="border-slate-200 shadow-sm">
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
                <div className="grid grid-cols-1 gap-6 border-b border-slate-100 pb-6 lg:grid-cols-2">
                    <Controller
                        name="georef_source"
                        defaultValue={'none'}
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Происхождение координат</FieldLabel>
                                <RadioGroup
                                    value={field.value ?? 'none'}
                                    onValueChange={field.onChange}
                                    className="space-y-2"
                                    aria-invalid={fieldState.invalid}
                                >
                                    {GEOREF_OPTIONS.map((opt) => (
                                        <div
                                            key={opt.value}
                                            className="flex items-center space-x-2"
                                        >
                                            <RadioGroupItem
                                                value={opt.value}
                                                id={`geo_${opt.value}`}
                                            />
                                            <FieldLabel
                                                htmlFor={`geo_${opt.value}`}
                                                className="cursor-pointer font-normal text-slate-700"
                                            >
                                                {opt.label}
                                            </FieldLabel>
                                        </div>
                                    ))}
                                </RadioGroup>
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                    <Field data-invalid={!!errors?.location_remarks}>
                        <FieldLabel htmlFor="location_remarks">
                            Географические примечания
                        </FieldLabel>
                        <Textarea
                            id="location_remarks"
                            className="h-28 resize-none"
                            placeholder="Примечания к местоположению…"
                            {...register('location_remarks')}
                        />
                        <FieldError errors={[errors?.location_remarks]} />
                    </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Controller
                        name="country"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="country">Страна</FieldLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || undefined}
                                >
                                    <SelectTrigger
                                        id="country"
                                        className="w-full"
                                        aria-invalid={fieldState.invalid}
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
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                    <FormAutocomplete
                        name="region"
                        label="Регион (субъект)"
                        searchFn={regionSearchFn}
                        placeholder="Начните вводить…"
                        onChangeExtra={handleAutocompleteChange}
                    />
                    <FormAutocomplete
                        name="district"
                        label="Район"
                        searchFn={districtSearchFn}
                        placeholder="Начните вводить…"
                        onChangeExtra={handleAutocompleteChange}
                    />
                    <Field data-invalid={!!errors?.locality}>
                        <FieldLabel htmlFor="locality">Локалитет (топоним)</FieldLabel>
                        <Input
                            id="locality"
                            placeholder="Исходное название места из статьи"
                            aria-invalid={!!errors?.locality}
                            {...register('locality')}
                        />
                        <FieldError errors={[errors?.locality]} />
                    </Field>
                </div>

                {!isNone && (
                    <div className="space-y-6 border-t border-slate-100 pt-5">
                        {isArticle && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel>Формат ввода координат</FieldLabel>
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
                                    </Field>
                                </div>

                                {coordFormat === 'DM' && <DMInputGroup prefix="" />}
                                {coordFormat === 'DMS' && <DMSInputGroup prefix="" />}
                            </div>
                        )}

                        {isCustom && (
                            <div className="space-y-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowMap(!showMap)}
                                >
                                    <MapIcon className="mr-2 h-4 w-4" />
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

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Field data-invalid={!!errors?.latitude}>
                                <FieldLabel htmlFor="latitude">Широта (DD)</FieldLabel>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    readOnly={isArticle && coordFormat !== 'DD'}
                                    className={
                                        isArticle && coordFormat !== 'DD'
                                            ? 'cursor-not-allowed bg-slate-100'
                                            : ''
                                    }
                                    aria-invalid={!!errors?.latitude}
                                    {...register('latitude' as const, {
                                        valueAsNumber: true,
                                    })}
                                />
                                <FieldError errors={[errors?.latitude]} />
                            </Field>
                            <Field data-invalid={!!errors?.longitude}>
                                <FieldLabel htmlFor="longitude">Долгота (DD)</FieldLabel>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    readOnly={isArticle && coordFormat !== 'DD'}
                                    className={
                                        isArticle && coordFormat !== 'DD'
                                            ? 'cursor-not-allowed bg-slate-100'
                                            : ''
                                    }
                                    aria-invalid={!!errors?.longitude}
                                    {...register('longitude' as const, {
                                        valueAsNumber: true,
                                    })}
                                />
                                <FieldError errors={[errors?.longitude]} />
                            </Field>
                            <Field data-invalid={!!errors?.coordinate_uncertainty}>
                                <FieldLabel htmlFor="coordinate_uncertainty">
                                    Неопределённость, м
                                </FieldLabel>
                                <Input
                                    id="coordinate_uncertainty"
                                    type="number"
                                    {...register('coordinate_uncertainty' as const, {
                                        valueAsNumber: true,
                                    })}
                                />
                                <FieldError errors={[errors?.coordinate_uncertainty]} />
                            </Field>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GeographyCard;
