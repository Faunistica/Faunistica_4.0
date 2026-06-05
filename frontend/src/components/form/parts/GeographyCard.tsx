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
import { FormAutocomplete } from '@/components/form/inputs/FormAutocomplete';
import { Button } from '@/components/ui/button';

import 'leaflet/dist/leaflet.css';
import { type FC, useState, useEffect } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { Map as MapIcon, MapPin } from 'lucide-react';

import { GeographyMap } from '@/components/map/GeographyMap';
import { DMInputGroup, DMSInputGroup } from '@/components/map/CoordinateInputs';
import { GEOREF_OPTIONS, COUNTRY_OPTIONS } from '@/lib/constants';

import { useLazyGeoSearchQuery } from '@/api/utilAPI';
import SavedPresetSelect from '@/components/form/inputs/SavedPresetSelect';
import type { RecordForm } from '@/types/forms';

interface Props {
    publ_id: number;
    activeRecordId: string | null;
}

const GeographyCard: FC<Props> = ({ publ_id, activeRecordId }) => {
    const { control, setValue, getValues } = useFormContext<RecordForm>();

    const georefSource = useWatch({ name: 'georef_source', control }) || 'none';
    const latValue = useWatch({ name: 'latitude', control });
    const lonValue = useWatch({ name: 'longitude', control });

    const [showMap, setShowMap] = useState(false);
    const [coordFormat, setCoordFormat] = useState<'DD' | 'DM' | 'DMS' | ''>('');

    useEffect(() => {
        if (georefSource == 'none') {
            setValue('latitude', 0, { shouldValidate: true });
            setValue('longitude', 0, { shouldValidate: true });
            setValue('verbatimcoordinates', null, { shouldValidate: true });
        } else if (georefSource == 'vol' && getValues('verbatimcoordinates') !== null) {
            setValue('verbatimcoordinates', null, {
                shouldValidate: true,
            });
        }
    }, [georefSource, setValue, getValues]);

    const handleMapSelect = (lat: number, lng: number) => {
        setValue('latitude' as const, lat, { shouldValidate: true });
        setValue('longitude' as const, lng, { shouldValidate: true });
    };

    const handleLocationSuggestionSelect = () => {
        setValue('is_manual_location', false);
    };

    const handleLocationTypedCommit = () => {
        setValue('is_manual_location', true);
    };

    const [searchRegion] = useLazyGeoSearchQuery();
    const [searchDistrict] = useLazyGeoSearchQuery();

    const regionSearchFn = (query: string) =>
        searchRegion({ field: 'region', query })
            .unwrap()
            .then((r) => r.suggestions ?? []);

    const districtSearchFn = (query: string) =>
        searchDistrict({ field: 'district', query })
            .unwrap()
            .then((r) => r.suggestions ?? []);

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
                    <div className="flex gap-2 md:items-center">
                        <span className="size-8 shrink-0 rounded-lg bg-emerald-50 p-2 text-emerald-600">
                            <MapPin className="size-4" />
                        </span>
                        <CardTitle className="text-lg font-semibold">
                            Пространственная локализация
                        </CardTitle>
                    </div>
                    <SavedPresetSelect
                        type="location"
                        publ_id={publ_id}
                        activeRecordId={activeRecordId}
                        className="w-full md:w-auto"
                    />
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 border-b border-slate-100 pb-6 lg:grid-cols-2">
                    <Controller
                        name="georef_source"
                        defaultValue={'none'}
                        control={control}
                        render={({ field, fieldState: { invalid, error } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel>Происхождение координат</FieldLabel>
                                <RadioGroup
                                    value={field.value ?? 'none'}
                                    onValueChange={field.onChange}
                                    className="space-y-2"
                                    aria-invalid={invalid}
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
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        control={control}
                        name="location_remarks"
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="location_remarks">
                                    Географические примечания
                                </FieldLabel>
                                <Textarea
                                    id="location_remarks"
                                    className="max-h-fit min-h-28"
                                    placeholder="Примечания к местоположению…"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Controller
                        name="country"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="country">Страна</FieldLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || undefined}
                                >
                                    <SelectTrigger
                                        id="country"
                                        className="w-full"
                                        aria-invalid={invalid}
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
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                    <FormAutocomplete
                        name="region"
                        label="Регион (субъект)"
                        options={regionSearchFn}
                        placeholder="Начните вводить…"
                        onSelectSuggestion={handleLocationSuggestionSelect}
                        onCommitTyped={handleLocationTypedCommit}
                    />
                    <FormAutocomplete
                        name="district"
                        label="Район"
                        options={districtSearchFn}
                        placeholder="Начните вводить…"
                        onSelectSuggestion={handleLocationSuggestionSelect}
                        onCommitTyped={handleLocationTypedCommit}
                    />
                    <Controller
                        name="locality"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="locality">Локалитет (топоним)</FieldLabel>
                                <Input
                                    id="locality"
                                    placeholder="Исходное название места из статьи"
                                    aria-invalid={invalid}
                                    {...field}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                {georefSource !== 'none' && (
                    <div className="space-y-6 border-t border-slate-100 pt-5">
                        {georefSource === 'lit' && (
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

                                {coordFormat === 'DM' && <DMInputGroup />}
                                {coordFormat === 'DMS' && <DMSInputGroup />}
                            </div>
                        )}

                        {georefSource === 'vol' && (
                            <div className="space-y-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setShowMap(!showMap)}
                                >
                                    <MapIcon className="size-4" />
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
                            {(georefSource !== 'lit' || coordFormat === 'DD' || !coordFormat) && (
                                <>
                                    <Controller
                                        control={control}
                                        name="latitude"
                                        render={({ field, fieldState: { invalid, error } }) => (
                                            <Field data-invalid={invalid}>
                                                <FieldLabel htmlFor="latitude">
                                                    Широта (DD)
                                                </FieldLabel>
                                                <Input
                                                    id="latitude"
                                                    type="number"
                                                    step="any"
                                                    aria-invalid={invalid}
                                                    {...field}
                                                />
                                                <FieldError errors={[error]} />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="longitude"
                                        render={({ field, fieldState: { invalid, error } }) => (
                                            <Field data-invalid={invalid}>
                                                <FieldLabel htmlFor="longitude">
                                                    Долгота (DD)
                                                </FieldLabel>
                                                <Input
                                                    id="longitude"
                                                    type="number"
                                                    step="any"
                                                    aria-invalid={invalid}
                                                    {...field}
                                                />
                                                <FieldError errors={[error]} />
                                            </Field>
                                        )}
                                    />
                                </>
                            )}
                            <Controller
                                control={control}
                                name="coordinate_uncertainty"
                                render={({ field, fieldState: { invalid, error } }) => (
                                    <Field data-invalid={invalid}>
                                        <FieldLabel htmlFor="coordinate_uncertainty">
                                            Неопределённость, м
                                        </FieldLabel>
                                        <Input
                                            id="coordinate_uncertainty"
                                            type="number"
                                            {...field}
                                            value={field.value?.toString()}
                                        />
                                        <FieldError errors={[error]} />
                                    </Field>
                                )}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GeographyCard;
