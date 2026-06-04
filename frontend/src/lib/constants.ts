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
    'Россия',
    'Беларусь',
    'Казахстан',
    'Украина',
    'Германия',
    'Эстония',
    'Латвия',
    'Литва',
    'США',
    'Другая',
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

export const QUANTITY_FIELDS: QuantityField[] = [
    'males',
    'subadultMales',
    'females',
    'subadultFemales',
    'adults',
    'juveniles',
] as const;

export const QUANTITY_FIELD_LABELS: Record<QuantityField, string> = {
    males: 'Самцов',
    subadultMales: 'Субвзрослых самцов',
    females: 'Самок',
    subadultFemales: 'Субвзрослых самок',
    adults: 'Взрослых (пол не определён)',
    juveniles: 'Ювенильных',
};

export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;
export const UNCERTAINTY_MIN = 30;
export const UNCERTAINTY_MAX = 15000;
