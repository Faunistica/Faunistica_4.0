// Re-export domain models for backward compatibility
export type {
    Specimen,
    RecordData,
    RecordFull,
    RuleCategory,
    RecordValidationError,
    Publication,
    UserInfo,
    ImportError,
} from './domain';

import type { RecordData, UserInfo, ImportError } from './domain';

export interface ApiErrorBody {
    // TODO: type detail properly as FastAPI validation errors (PydanticValidationError[])
    detail?: string | unknown[];
    message?: string;
    error?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export type UserLoginResponse = UserInfo;

export interface CreateRecordRequest {
    publ_id: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export interface SuggestTaxonRequest {
    field: 'family' | 'genus' | 'species';
    query: string;
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
}

export interface RecordListRequest {
    publ_id: number;
    user_id?: number;
    page?: number;
    page_size?: number;
    pivot_record_id?: string;
    sort?: 'created_at' | 'updated_at';
}

export interface UpdateRecordRequest {
    record_id: string;
    data: RecordData;
    publ_id?: number;
    submit: boolean;
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
    query: string;
    region?: string | null;
}

export interface GeoSearchResponse {
    suggestions: string[] | null;
}

export interface UploadExcelResponse {
    imported: number;
    failed: number;
    errors: ImportError[];
}

export interface SupportRequest {
    link: string;
    user_name: string;
    text: string;
    issue_type: string;
}

export interface StatisticsResponse {
    total_volunteers: number;
    total_records: number;
    species_count: number;
    processed_publications_count: number;
    most_common_family: string | null;
    most_common_genus: string | null;
    most_common_species: string | null;
}

export interface TopSpeciesItem {
    species: string;
    count: number;
}

export interface UserStatisticsResponse {
    user_id: number;
    name: string | null;
    records_entered: number;
    publications_processed: number;
    most_common_family: string | null;
    most_common_genus: string | null;
    most_common_species: string | null;
    top_species: TopSpeciesItem[];
}
