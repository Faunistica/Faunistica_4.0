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
    { value: 'lit', label: 'form.spatial.sourceCoordinates' },
    { value: 'vol', label: 'form.spatial.ownGeoreference' },
    { value: 'none', label: 'form.spatial.noCoordinates' },
] as const;

export const TYPE_STATUS_OPTIONS = [
    { value: 'none', label: 'form.typeStatus.none' },
    { value: 'голотип', label: 'form.typeStatus.holotype' },
    { value: 'паратип', label: 'form.typeStatus.paratype' },
    { value: 'неотип', label: 'form.typeStatus.neotype' },
    { value: 'топотип', label: 'form.typeStatus.topotype' },
    { value: 'синтип', label: 'form.typeStatus.syntype' },
    { value: 'лектотип', label: 'form.typeStatus.lectotype' },
    { value: 'тип', label: 'form.typeStatus.type' },
] as const;

export const TAXON_RANK_OPTIONS = [
    { value: 'genus', label: 'form.taxonRank.genus' },
    { value: 'species', label: 'form.taxonRank.species' },
    { value: 'subspecies', label: 'form.taxonRank.subspecies' },
] as const;

export const QUANTITY_TYPE_OPTIONS = [
    { value: 'individuals', label: 'form.quantityType.individuals' },
    {
        value: 'individuals per 10 trap-days',
        label: 'form.quantityType.individualsPer10TrapDays',
    },
    {
        value: 'individuals per 100 trap-days',
        label: 'form.quantityType.individualsPer100TrapDays',
    },
    { value: 'individuals per m2', label: 'form.quantityType.individualsPerM2' },
    {
        value: 'Abundance class (Pesenko, 1982)',
        label: 'form.quantityType.abundanceClassPesenko',
    },
    {
        value: 'individuals per 10 net sweps',
        label: 'form.quantityType.individualsPer10NetSweeps',
    },
    {
        value: 'individuals per 20 net sweppings',
        label: 'form.quantityType.individualsPer20NetSweepings',
    },
    {
        value: 'individuals per 100 net sweps',
        label: 'form.quantityType.individualsPer100NetSweeps',
    },
    {
        value: 'individuals per 10 ditch-days',
        label: 'form.quantityType.individualsPer10DitchDays',
    },
    {
        value: 'individuals per 100 pitfall-traps',
        label: 'form.quantityType.individualsPer100PitfallTraps',
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
    males: 'form.quantitative.males',
    subadultMales: 'form.quantitative.subadultMales',
    females: 'form.quantitative.females',
    subadultFemales: 'form.quantitative.subadultFemales',
    adults: 'form.quantitative.adultsUnknownSex',
    juveniles: 'form.quantitative.juveniles',
};

export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;
export const UNCERTAINTY_MAX = 15000;
