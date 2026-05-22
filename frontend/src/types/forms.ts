const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;
const UNCERTAINTY_MIN = 30;
const UNCERTAINTY_MAX = 15000;

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
    { value: 'individuals', label: 'особей' },
    {
        value: 'individuals per 10 trap-days',
        label: 'особей на 10 ловушко-суток',
    },
    {
        value: 'individuals per 100 trap-days',
        label: 'особей на 100 ловушко-суток',
    },
    { value: 'individuals per m2', label: 'особей на м²' },
    {
        value: 'Abundance class (Pesenko, 1982)',
        label: 'балл обилия (по Песенко)',
    },
    {
        value: 'individuals per 10 net sweps',
        label: 'особей на 10 взмахов сачком',
    },
    {
        value: 'individuals per 20 net sweppings',
        label: 'особей на 20 взмахов сачком',
    },
    {
        value: 'individuals per 100 net sweps',
        label: 'особей на 100 взмахов сачком',
    },
    {
        value: 'individuals per 10 ditch-days',
        label: 'особей на 10 канаво-суток',
    },
    {
        value: 'individuals per 100 pitfall-traps',
        label: 'особей на 100 ловушек',
    },
] as const;

export type QuantityField =
    | 'males'
    | 'subadultMales'
    | 'females'
    | 'subadultFemales'
    | 'adults'
    | 'juveniles';

export const QUANTITY_FIELD_LABELS: Record<QuantityField, string> = {
    males: 'Самцов',
    subadultMales: 'Субвзрослых самцов',
    females: 'Самок',
    subadultFemales: 'Субвзрослых самок',
    adults: 'Взрослых (пол не определён)',
    juveniles: 'Ювенильных',
};

import { z } from 'zod';

export const formRecordSchema = z.object({
    // ═══ LOCATION ═══
    georef_source: z.enum(['lit', 'vol', 'none']).nullish(),
    country: z.string().min(1, 'Обязательное поле'),
    region: z.string().min(1, 'Обязательное поле'),
    district: z.string().min(1, 'Обязательное поле'),
    locality: z.string().min(1, 'Обязательное поле'),
    is_manual_location: z.boolean().nullish(),
    verbatimcoordinates: z.string().nullish(),
    latitude: z.number('Число').min(LAT_MIN, `Мин. ${LAT_MIN}`).max(LAT_MAX, `Макс. ${LAT_MAX}`),
    longitude: z.number('Число').min(LNG_MIN, `Мин. ${LNG_MIN}`).max(LNG_MAX, `Макс. ${LNG_MAX}`),
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
    males: z.number().min(0).nullish(),
    subadultMales: z.number().min(0).nullish(),
    females: z.number().min(0).nullish(),
    subadultFemales: z.number().min(0).nullish(),
    adults: z.number().min(0).nullish(),
    juveniles: z.number().min(0).nullish(),
});

export type FormRecord = z.infer<typeof formRecordSchema>;
