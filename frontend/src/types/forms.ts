// src/types/forms.ts
// Form types — Zod schema, form types, and defaults

import { z } from 'zod';
import { LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX, UNCERTAINTY_MIN, UNCERTAINTY_MAX } from './constants';
import type { QuantityField } from './constants';

export const recordFormSchema = z.object({
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
    males: z.coerce.number().min(0).nullish(),
    subadultMales: z.coerce.number().min(0).nullish(),
    females: z.coerce.number().min(0).nullish(),
    subadultFemales: z.coerce.number().min(0).nullish(),
    adults: z.coerce.number().min(0).nullish(),
    juveniles: z.coerce.number().min(0).nullish(),
});

export type RecordForm = z.infer<typeof recordFormSchema>;

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
    verbatimcoordinates: '',
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
