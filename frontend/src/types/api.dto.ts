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

export interface SubmitPublicationRequest {
    processing_level: 'full' | 'ural' | 'part' | 'skip';
    urals_scope?: 'yes' | 'no' | null;
    material_status?: 'yes' | 'no' | null;
    comment?: string | null;
}

export interface SubmitStatusResponse {
    draft_record_ids: string[];
}

export interface SupportRequest {
    link: string;
    user_name: string;
    text: string;
    issue_type: string;
}

export interface CumulativePoint {
    date: string;
    count: number;
}

export interface ProgressInfo {
    coverage: number;
    total_publications: number;
    processed_publications: number;
    fully_processed_publications: number;
}

export interface StatisticsResponse {
    total_volunteers: number;
    total_records: number;
    species_count: number;
    processed_publications_count: number;
    total_users: number;
    families_count: number;
    checks_count: number;
    failed_records: number;
    cumulative_volunteers: CumulativePoint[];
    cumulative_records: CumulativePoint[];
    progress: ProgressInfo | null;
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
    checks_count: number;
    failed_records: number;
    total_individuals: number;
    distinct_families: number;
    distinct_genera: number;
    distinct_species: number;
    most_common_year: number | null;
}

export interface TelegramAuthInitResponse {
    code: string;
    code_expires_in: number;
    token: string;
    token_expires_in: number;
    bot_url: string;
}

export interface TelegramAuthStatusResponse {
    status?: 'pending' | 'need_registration' | 'authorized' | 0 | 1 | 2 | 3;
    code?: string;
    code_expires_in?: number;
    user_id?: number;
    name?: string;
    username?: string;
}

export interface RegisterRequest {
    token: string;
    code: string;
    name: string;
    username: string;
    password: string;
    age: number;
    rating: boolean;
    sex: 'M' | 'F' | 'N';
    lng: 'rus' | 'eng' | 'all';
    comm?: string;
}

export interface RegisterResponse {
    message: string;
    user_id: number;
}

export interface UserFull {
    user_id: number;
    name: string;
    tlg_name?: string | null;
    tlg_username?: string | null;
    reg_stat?: number | null;
    username?: string | null;
    items?: string;
    age?: number | null;
    lng?: 'eng' | 'rus' | 'all' | null;
    comm?: string | null;
    reg_run?: string | null;
    reg_end?: string | null;
    sex?: string | null;
    rating?: number | null;
    email?: string | null;
    region?: string | null;
}

export interface UserUpdateMeRequest {
    username?: string | null;
    password?: string | null;
    name?: string | null;
    age?: number | null;
    lng?: 'eng' | 'rus' | 'all' | null;
    comm?: string | null;
    sex?: string | null;
    rating?: number | null;
    email?: string | null;
    region?: string | null;
}
