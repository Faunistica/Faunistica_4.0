import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
    FetchBaseQueryMeta,
    QueryReturnValue,
} from '@reduxjs/toolkit/query';
import type { ApiErrorBody } from '@/types/api.dto';
import { logout } from '../store/reducers/userSlice';

const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include',
});

interface TypedFetchBaseQueryError extends Omit<FetchBaseQueryError, 'data'> {
    data?: ApiErrorBody;
}

function normalizeErrorData(data: unknown): ApiErrorBody | undefined {
    if (!data || typeof data !== 'object') return undefined;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const body = data as Record<string, unknown>;

    let message: string | undefined;
    const detail = body.detail;

    if (typeof detail === 'string') {
        message = detail;
    } else if (Array.isArray(detail)) {
        message = detail
            .map((e: Record<string, unknown>) =>
                typeof e.msg === 'string' ? e.msg : (JSON.stringify(e) ?? ''),
            )
            .join('; ');
    } else if (typeof body.message === 'string') {
        message = body.message;
    }

    return {
        message,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        detail: detail as string | unknown[] | undefined,
        error: typeof body.error === 'string' ? body.error : undefined,
    };
}

function transformError(
    result: QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>,
): QueryReturnValue<unknown, TypedFetchBaseQueryError, FetchBaseQueryMeta> {
    if (!result.error) {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        return result as QueryReturnValue<unknown, TypedFetchBaseQueryError, FetchBaseQueryMeta>;
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return {
        ...result,
        error: { ...result.error, data: normalizeErrorData(result.error.data) },
    } as QueryReturnValue<unknown, TypedFetchBaseQueryError, FetchBaseQueryMeta>;
}

export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    TypedFetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
        return transformError(result);
    }

    const refreshResult = await baseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions,
    );

    if (refreshResult.data) {
        result = await baseQuery(args, api, extraOptions);
    } else {
        api.dispatch(logout());
    }

    return transformError(result);
};
