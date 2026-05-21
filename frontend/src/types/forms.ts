export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;
export const UNCERTAINTY_MIN = 30;
export const UNCERTAINTY_MAX = 15000;

// src/types/forms.ts

// 🔒 Поля, обязательные для перехода к следующему образцу
export const BLOCKING_FIELDS = [
    'country',
    'region',
    'district',
    'locality',
    'verbatim_date',
    'sampling_protocol',
    'recorded_by',
    'family',
    'genus',
    'species',
] as const;

export type BlockingFieldName = (typeof BLOCKING_FIELDS)[number];

// 📋 Человеко-читаемые названия полей для ошибок
export const FIELD_LABELS: Record<string, string> = {
    country: 'Страна',
    region: 'Регион',
    district: 'Район',
    locality: 'Локалитет',
    family: 'Семейство',
    genus: 'Род',
    latitude: 'Широта',
    longitude: 'Долгота',
    species: 'Вид',
    verbatim_date: 'Дата сбора',
    sampling_protocol: 'Метод сбора',
    recorded_by: 'Коллектор',
    mmm: 'Самцы',
    ssm: 'Самки',
    // ...добавь остальные
};

// 🏷️ Хелпер для получения названия поля
export const getFieldLabel = (fieldName: string): string => {
    return FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ');
};

export const COUNTRY_OPTIONS = [
    { value: 'RU', label: 'Россия' },
    { value: 'BY', label: 'Беларусь' },
    { value: 'KZ', label: 'Казахстан' },
    { value: 'UA', label: 'Украина' },
    { value: 'DE', label: 'Германия' },
    { value: 'EE', label: 'Эстония' },
    { value: 'LV', label: 'Латвия' },
    { value: 'LT', label: 'Литва' },
    { value: 'US', label: 'США' },
    { value: 'OTHER', label: 'Другая' },
] as const;

export const GEOREF_OPTIONS = [
    { value: 'lit', label: 'Из источника (оригинальные)' },
    { value: 'vol', label: 'Собственная геопривязка (волонтёр)' },
    { value: 'none', label: 'Данные отсутствуют' },
] as const;

export const TYPE_STATUS_OPTIONS = [
    { value: 'none', label: 'Нет' },
    { value: 'голотип', label: 'Голотип' },
    { value: 'паратип', label: 'Паратип' },
    { value: 'неотип', label: 'Неотип' },
    { value: 'топотип', label: 'Топотип' },
    { value: 'синтип', label: 'Синтип' },
    { value: 'лектотип', label: 'Лектотип' },
    { value: 'тип', label: 'Тип' },
] as const;

export const TAXON_RANK_OPTIONS = [
    { value: 'genus', label: 'Род (genus)' },
    { value: 'species', label: 'Вид (species)' },
    { value: 'subspecies', label: 'Подвид (subspecies)' },
] as const;

export const QUANTITY_TYPE_OPTIONS = [
    { value: 'особей', label: 'особей' },
    {
        value: 'особей на 10 ловушко-суток',
        label: 'особей на 10 ловушко-суток',
    },
    {
        value: 'особей на 100 ловушко-суток',
        label: 'особей на 100 ловушко-суток',
    },
    { value: 'особей на м²', label: 'особей на м²' },
    { value: 'балл обилия (по Песенко)', label: 'балл обилия (по Песенко)' },
    {
        value: 'особей на 10 взмахов сачком',
        label: 'особей на 10 взмахов сачком',
    },
    {
        value: 'особей на 20 взмахов сачком',
        label: 'особей на 20 взмахов сачком',
    },
    {
        value: 'особей на 100 взмахов сачком',
        label: 'особей на 100 взмахов сачком',
    },
    {
        value: 'особей на 200 взмахов сачком',
        label: 'особей на 200 взмахов сачком',
    },
] as const;

export const QUANTITY_FIELDS = ['mmm', 'ssm', 'fff', 'ssf', 'adu', 'juv'] as const;
export type QuantityField = (typeof QUANTITY_FIELDS)[number];

export const QUANTITY_FIELD_LABELS: Record<QuantityField, string> = {
    mmm: 'Самцов',
    ssm: 'Субвзрослых самцов',
    fff: 'Самок',
    ssf: 'Субвзрослых самок',
    adu: 'Взрослых (пол не определён)',
    juv: 'Ювенильных',
};

export const LOCATION_FIELDS = [
    'country',
    'region',
    'district',
    'locality',
    'is_manual_location',
    'latitude',
    'longitude',
    'verbatimcoordinates',
    'coordinate_uncertainty',
    'georef_source',
    'location_remarks',
] as const;

// ── Event field keys (for preset extraction) ──
export const EVENT_FIELDS = [
    'verbatim_date',
    'habitat',
    'recorded_by',
    'sampling_protocol',
    'sampling_effort',
    'event_remarks',
    'field_number',
    'catalog_number',
    'collection_code',
] as const;

export function buildLocationLabel(data: Record<string, unknown>): string {
    const parts = [data.country, data.region, data.district, data.locality].filter(
        Boolean,
    ) as string[];
    return parts.length > 0 ? parts.join(', ') : 'Без названия';
}

/**
 * Build a human-readable label for an event preset.
 */
export function buildEventLabel(data: Record<string, unknown>): string {
    const parts: string[] = [];
    if (data.verbatim_date) parts.push(String(data.verbatim_date));
    if (data.habitat) parts.push(String(data.habitat).slice(0, 30));
    if (data.recorded_by) parts.push(String(data.recorded_by));
    return parts.length > 0 ? parts.join(' · ') : 'Без данных';
}

import { z } from 'zod';

export const recordSchema = z.object({
    // ═══ LOCATION ═══
    georef_source: z.enum(['lit', 'vol', 'none']).nullish(),
    country: z.string().min(1, 'Обязательное поле'),
    region: z.string().min(1, 'Обязательное поле'),
    district: z.string().min(1, 'Обязательное поле'),
    locality: z.string().min(1, 'Обязательное поле'),
    is_manual_location: z.boolean().nullish(),
    verbatimcoordinates: z.string().nullish(),
    latitude: z
        .number({ invalid_type_error: 'Число' })
        .min(LAT_MIN, `Мин. ${LAT_MIN}`)
        .max(LAT_MAX, `Макс. ${LAT_MAX}`),
    longitude: z
        .number({ invalid_type_error: 'Число' })
        .min(LNG_MIN, `Мин. ${LNG_MIN}`)
        .max(LNG_MAX, `Макс. ${LNG_MAX}`),
    coordinate_uncertainty: z
        .number()
        .min(UNCERTAINTY_MIN, `Мин. ${UNCERTAINTY_MIN}`)
        .max(UNCERTAINTY_MAX, `Макс. ${UNCERTAINTY_MAX}`)
        .nullish(),
    location_remarks: z.string().nullish(),

    // ═══ EVENT + OCCURRENCE ═══
    verbatim_date: z.string().min(1, 'Обязательное поле'),
    date_precision: z.string().nullish(),
    is_interval: z.boolean().nullish(),
    habitat: z.string().nullish(),
    sampling_protocol: z.string().min(1, 'Обязательное поле'),
    sampling_effort: z.string().nullish(),
    sample_size_value: z.number().nullish(),
    sample_size_unit: z.string().nullish(),
    event_remarks: z.string().nullish(),
    field_number: z.string().nullish(),
    catalog_number: z.string().nullish(),
    collection_code: z.string().nullish(),
    recorded_by: z.string().min(1, 'Обязательное поле'),

    // ═══ TAXONOMY ═══
    family: z.string().min(1, 'Обязательное поле'),
    genus: z.string().min(1, 'Обязательное поле'),
    species: z.string().min(1, 'Обязательное поле'),
    tax_verbatim: z.boolean().nullish(),
    taxon_rank: z.enum(['genus', 'species', 'subspecies']).nullish(),
    type_status: z.string().nullish(),
    accepted_name: z.string().nullish(),
    taxon_remarks: z.string().nullish(),
    identification_remarks: z.string().nullish(),

    // ═══ QUANTITIES ═══
    quantity_type: z.string().nullish(),
    occurrence_remarks: z.string().nullish(),
    mmm: z.number().min(0).nullish(),
    ssm: z.number().min(0).nullish(),
    fff: z.number().min(0).nullish(),
    ssf: z.number().min(0).nullish(),
    adu: z.number().min(0).nullish(),
    juv: z.number().min(0).nullish(),

    // ═══ INTERNAL ═══
    record_ids: z.record(z.string(), z.string()).optional(),
});

export const formSchema = z.object({
    samples: z.array(recordSchema),
});

export type FormSchema = z.infer<typeof formSchema>;
export type RecordSchema = z.infer<typeof recordSchema>;
