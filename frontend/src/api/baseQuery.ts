import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from '../store/reducers/userSlice';

const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include',
});

export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
        return result;
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

    return result;
};
