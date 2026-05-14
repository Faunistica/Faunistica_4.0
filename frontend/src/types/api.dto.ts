export interface LoginRequest {
    username: string;
    password: string;
}

export interface UserLoginResponse {
    user_id: number;
    username: string;
}

export interface UserInfo {
    user_id: number;
    username: string;
}

export interface RecordBelonging {
    publ_id: number;
    user_id: number;
}

export interface RecordData {
    publ_id: number;
    country?: string | null;
    region?: string | null;
    district?: string | null;
    locality?: string | null;
    is_manual_location?: boolean | null;
    latitude?: number | null;
    longitude?: number | null;
    verbatimcoordinates?: string | null;
    coordinate_uncertainty?: number | null;
    georef_source?: string | null;
    location_remarks?: string | null;
    verbatim_date?: string | null;
    date_precision?: string | null;
    is_interval?: boolean | null;
    habitat?: string | null;
    sampling_protocol?: string | null;
    sampling_effort?: string | null;
    sample_size_value?: number | null;
    sample_size_unit?: string | null;
    event_remarks?: string | null;
    field_number?: string | null;
    catalog_number?: string | null;
    collection_code?: string | null;
    recorded_by?: string | null;
    family?: string | null;
    genus?: string | null;
    species?: string | null;
    tax_verbatim?: boolean | null;
    taxon_rank?: string | null;
    type_status?: string | null;
    accepted_name?: string | null;
    taxon_remarks?: string | null;
    quantity?: number | null;
    quantity_type?: string | null;
    sex?: string | null;
    life_stage?: string | null;
    occurrence_remarks?: string | null;
    identification_remarks?: string | null;
}

export interface RecordFull extends RecordData {
    user_id: number;
    id: string;
    errors?: string | null;
    type?: string | null;
    created_at: string;
    updated_at?: string | null;
    ip?: string | null;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export interface DraftRecord extends Omit<RecordData, 'quantity' | 'sex' | 'life_stage'> {
    mmm?: number | null;
    ssm?: number | null;
    fff?: number | null;
    ssf?: number | null;
    adu?: number | null;
    juv?: number | null;
    record_ids?: Record<string, string>;
}

export interface SuggestTaxonRequest {
    field: 'family' | 'genus' | 'species';
    text: string;
    family?: string | null;
    genus?: string | null;
}

export interface SuggestTaxonResponse {
    suggestions: string[] | null;
}

export interface AutofillTaxonRequest {
    field: 'family' | 'genus' | 'species';
    text: string;
}

export interface AutofillTaxonResponse {
    family?: string | null;
    genus?: string | null;
}

export interface RecordIdRequest {
    record_id: string;
    user_id: number;
}

export interface RecordListRequest {
    publ_id: number;
    user_id: number;
    page?: number;
    page_size?: number;
    sort?: string;
}

export interface EditRecordRequest extends RecordData {
    record_id: string;
    user_id: number;
}

export interface GetLocationRequest {
    degrees_n: number;
    minutes_n?: number | null;
    seconds_n?: number | null;
    degrees_e: number;
    minutes_e?: number | null;
    seconds_e?: number | null;
}

export interface GetLocationResponse {
    country?: string | null;
    region?: string | null;
    district?: string | null;
}

export interface GeoSearchRequest {
    field: string;
    text: string;
    region?: string | null;
}

export interface GeoSearchResponse {
    suggestions: string[] | null;
}

export interface SupportRequest {
    link: string;
    user_name: string;
    text: string;
    issue_type: string;
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