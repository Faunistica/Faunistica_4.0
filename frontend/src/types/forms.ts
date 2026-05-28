export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;
export const UNCERTAINTY_MIN = 30;
export const UNCERTAINTY_MAX = 15000;

import type { RecordFull } from './api.dto';

// 🔒 Поля, обязательные для заполнения
export const REQUIRED_FIELDS = [
    'latitude',
    'longitude',
    'georef_source',
    'verbatim_date',
    'recorded_by',
    'family',
    'genus',
    'species',
] as const;

export type RequiredFieldName = (typeof REQUIRED_FIELDS)[number];

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
    { value: 'особей на 10 ловушко-суток', label: 'особей на 10 ловушко-суток' },
    { value: 'особей на 100 ловушко-суток', label: 'особей на 100 ловушко-суток' },
    { value: 'особей на м²', label: 'особей на м²' },
    { value: 'балл обилия (по Песенко)', label: 'балл обилия (по Песенко)' },
    { value: 'особей на 10 взмахов сачком', label: 'особей на 10 взмахов сачком' },
    { value: 'особей на 20 взмахов сачком', label: 'особей на 20 взмахов сачком' },
    { value: 'особей на 100 взмахов сачком', label: 'особей на 100 взмахов сачком' },
    { value: 'особей на 200 взмахов сачком', label: 'особей на 200 взмахов сачком' },
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

export interface FormSchema {
    samples: (RecordFull & {
        mmm?: number | null;
        ssm?: number | null;
        fff?: number | null;
        ssf?: number | null;
        adu?: number | null;
        juv?: number | null;
        record_ids?: { base: string };
    })[];
}
