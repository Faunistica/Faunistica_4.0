export interface UserRequest {
    username: string;
    password: string;
}

export interface InfoRequest {
    text: string;
}

export interface InfoResponse {
    country?: string | null;
    region?: string | null;
    district?: string | null;
    gathering_place?: string | null;
    coordinate_north?: Record<string, number | null> | null;
    coordinate_east?: Record<string, number | null> | null;
    date?: string | null;
    family?: string | null;
    genus?: string | null;
    species?: string | null;
    collector?: string | null;
    count_males?: number | null;
    count_females?: number | null;
    count_juv_male?: number | null;
    count_juv_female?: number | null;
    count_juv?: number | null;
}

export interface InsertRecordsRequest {
    abu_ind_rem?: string | null;
    adm_verbatim?: boolean | null;
    begin_day?: number | null;
    begin_month?: number | null;
    begin_year?: number | null;
    biotope?: string | null;
    collector?: string | null;
    country?: string | null;
    district?: string | null;
    east?: string | null;
    end_day?: number | null;
    end_month?: number | null;
    end_year?: number | null;
    eve_REM?: string | null;
    family?: string | null;
    genus?: string | null;
    geo_origin?: string | null;
    geo_REM?: string | null;
    geo_uncert?: number | null;
    is_defined_species?: boolean | null;
    is_in_wsc?: boolean | null;
    is_new_species?: boolean | null;
    measurement_units?: string | null;
    north?: string | null;
    place?: string | null;
    place_notes?: string | null;
    region?: string | null;
    selective_gain?: string | null;
    species?: string | null;
    specimens?: Record<string, number | null> | null;
    taxonomic_notes?: string | null;
    type_status?: string | null;
}

export interface SpeciesStats {
    species: string;
    count: number;
}

export interface LatestRecord {
    datetime: string;
    species: string;
    location: string;
    username: string;
}

export interface StatisticsResponse {
    total_publications: number;
    processed_publications: number;
    total_species: number;
    unique_species: number;
    top_species: SpeciesStats[];
    latest_records: LatestRecord[];
}

export interface SuggestTaxonRequest {
    field: string;
    text: string;
    filters?: Record<string, string | null> | null;
}

export interface SuggestTaxonResponse {
    suggestions: string[] | null;
}

export interface AutofillTaxonRequest {
    field: string;
    text: string;
}

export interface AutofillTaxonResponse {
    family?: string | null;
    genus?: string | null;
}

export interface RecordHashRequest {
    hash: string;
}

export interface GetRecordResponse {
    hash: string;
    type?: string | null;
    adm_country?: string | null;
    adm_region?: string | null;
    adm_district?: string | null;
    adm_loc?: string | null;
    geo_nn_raw?: string | null;
    geo_ee_raw?: string | null;
    geo_origin?: string | null;
    geo_REM?: string | null;
    eve_YY?: number | null;
    eve_MM?: number | null;
    eve_DD?: number | null;
    eve_day_def?: boolean | null;
    eve_habitat?: string | null;
    eve_effort?: string | null;
    abu_coll?: string | null;
    eve_REM?: string | null;
    tax_fam?: string | null;
    tax_gen?: string | null;
    tax_sp?: string | null;
    tax_sp_def?: boolean | null;
    tax_nsp?: boolean | null;
    type_status?: string | null;
    tax_REM?: string | null;
    abu?: number | null;
    abu_details?: string | null;
    abu_ind_rem?: string | null;
    geo_uncert?: number | null;
    eve_YY_end?: number | null;
    eve_MM_end?: number | null;
    eve_DD_end?: number | null;
}

export interface EditRecordRequest extends Partial<GetRecordResponse> {
    hash: string;
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
    filters?: Record<string, string | null> | null;
}

export interface SupportRequest {
    link: string;
    user_name?: string | null;
    text: string;
    issue_type: string;
}