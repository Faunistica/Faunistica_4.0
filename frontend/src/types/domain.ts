export interface Specimen {
    sex: 'male' | 'female' | 'none';
    life_stage: 'adult' | 'subadult' | 'juvenile' | 'none';
    count: number;
}

export interface RecordData {
    country: string | null;
    region: string | null;
    district: string | null;
    locality: string | null;
    is_manual_location: boolean | null;
    latitude: string | null;
    longitude: string | null;
    verbatimcoordinates: string | null;
    coordinate_uncertainty: number | null;
    georef_source: string | null;
    location_remarks: string | null;
    verbatim_date: string | null;
    date_precision: string | null;
    is_interval: boolean | null;
    habitat: string | null;
    sampling_protocol: string | null;
    sampling_effort: string | null;
    sample_size_value: number | null;
    sample_size_unit: string | null;
    event_remarks: string | null;
    field_number: string | null;
    catalog_number: string | null;
    collection_code: string | null;
    recorded_by: string | null;
    family: string | null;
    genus: string | null;
    species: string | null;
    tax_verbatim: boolean | null;
    taxon_rank: string | null;
    type_status: string | null;
    accepted_name: string | null;
    taxon_remarks: string | null;
    quantity_type: string | null;
    specimens: Specimen[] | null;
    occurrence_remarks: string | null;
    identification_remarks: string | null;
}

export interface RecordFull extends RecordData {
    id: string;
    publ_id: number;
    user_id: number;
    errors?: RecordValidationError[] | null;
    type?: string | null;
    created_at: string;
    updated_at: string;
    ip?: string | null;
}

export type RuleCategory = 'taxonomy' | 'geo' | 'location' | 'event' | 'abundance';

export interface RecordValidationError {
    fields: string[];
    code: string;
    message: string;
    category?: RuleCategory | null;
}

export interface Publication {
    publ_id: number;
    type: string;
    author?: string | null;
    year?: number | null;
    name?: string | null;
    external?: string | null;
    language?: string | null;
    pdf_file?: string | null;
    bib_file?: string | null;
    arj_file?: string | null;
    resume?: string | null;
    ural?: number | boolean;
    coords?: number | boolean;
    cover?: number | boolean;
    occs?: number | boolean;
    spec?: number | boolean;
    e_author?: string | null;
    e_name?: string | null;
}

export interface UserInfo {
    user_id: number;
    username: string;
    name: string;
}

export interface ImportError {
    row: number;
    error: string;
}
