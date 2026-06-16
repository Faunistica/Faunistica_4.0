import { z } from 'zod';
import i18next from 'i18next';
import { LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX, UNCERTAINTY_MAX } from '@/lib/constants';
import type { QuantityField } from '@/lib/constants';

export function recordFormSchema() {
    const req = i18next.t('formValidation.required');
    const num = i18next.t('formValidation.number');
    const minLat = i18next.t('formValidation.min', { value: LAT_MIN });
    const maxLat = i18next.t('formValidation.max', { value: LAT_MAX });
    const minLng = i18next.t('formValidation.min', { value: LNG_MIN });
    const maxLng = i18next.t('formValidation.max', { value: LNG_MAX });
    const maxUnc = i18next.t('formValidation.max', { value: UNCERTAINTY_MAX });

    return z.object({
        // ═══ LOCATION ═══
        georef_source: z.enum(['lit', 'vol', 'none']).nullish(),
        country: z.string().min(1, req),
        region: z.string().min(1, req),
        district: z.string().min(1, req),
        locality: z.string().min(1, req),
        is_manual_location: z.boolean().nullish(),
        verbatimcoordinates: z.string().nullish(),
        latitude: z.coerce
            .number<number>(num)
            .min(LAT_MIN, minLat)
            .max(LAT_MAX, maxLat),
        longitude: z.coerce
            .number<number>(num)
            .min(LNG_MIN, minLng)
            .max(LNG_MAX, maxLng),
        coordinate_uncertainty: z.coerce
            .number<number>()
            .max(UNCERTAINTY_MAX, maxUnc)
            .nullish(),
        location_remarks: z.string().nullish(),

        // ═══ EVENT + OCCURRENCE ═══
        verbatim_date: z.string().min(1, req),
        date_precision: z.string().nullish(),
        is_interval: z.boolean().nullish(),
        habitat: z.string().nullish(),
        sampling_protocol: z.string().min(1, req),
        sampling_effort: z.string().nullish(),
        sample_size_value: z.coerce.number<number>().nullish(),
        sample_size_unit: z.string().nullish(),
        event_remarks: z.string().nullish(),
        field_number: z.string().nullish(),
        catalog_number: z.string().nullish(),
        collection_code: z.string().nullish(),
        recorded_by: z.string().min(1, req),

        // ═══ TAXONOMY ═══
        family: z.string().min(1, req),
        genus: z.string().min(1, req),
        species: z.string().min(1, req),
    tax_verbatim: z.boolean().nullish(),
    taxon_rank: z.enum(['genus', 'species', 'subspecies']).nullish(),
    type_status: z.string().nullish(),
    accepted_name: z.string().nullish(),
    taxon_remarks: z.string().nullish(),
    identification_remarks: z.string().nullish(),

    // ═══ QUANTITIES ═══
    quantity_type: z.string().nullish(),
    occurrence_remarks: z.string().nullish(),
    males: z.coerce.number<number>().min(0).nullish(),
    subadultMales: z.coerce.number<number>().min(0).nullish(),
    females: z.coerce.number<number>().min(0).nullish(),
    subadultFemales: z.coerce.number<number>().min(0).nullish(),
    adults: z.coerce.number<number>().min(0).nullish(),
    juveniles: z.coerce.number<number>().min(0).nullish(),
});

export type RecordForm = z.infer<ReturnType<typeof recordFormSchema>>;

export type RecordFormKey<V> = {
    [K in keyof RecordForm]-?: RecordForm[K] extends V ? K : never;
}[keyof RecordForm];

export const FORM_DEFAULT_VALUES: RecordForm = {
    country: '',
    region: '',
    district: '',
    locality: '',
    georef_source: undefined,
    is_manual_location: false,
    verbatimcoordinates: null,
    latitude: 0,
    longitude: 0,
    coordinate_uncertainty: 0,
    location_remarks: '',
    verbatim_date: '',
    date_precision: '',
    is_interval: false,
    habitat: '',
    sampling_protocol: '',
    sampling_effort: '',
    sample_size_value: 0,
    sample_size_unit: '',
    event_remarks: '',
    field_number: '',
    catalog_number: '',
    collection_code: '',
    recorded_by: '',
    family: '',
    genus: '',
    species: '',
    tax_verbatim: false,
    taxon_rank: undefined,
    type_status: '',
    accepted_name: '',
    taxon_remarks: '',
    identification_remarks: '',
    quantity_type: '',
    occurrence_remarks: '',
    males: 0,
    subadultMales: 0,
    females: 0,
    subadultFemales: 0,
    adults: 0,
    juveniles: 0,
};

// Re-export QuantityField for backward compatibility
export type { QuantityField };
