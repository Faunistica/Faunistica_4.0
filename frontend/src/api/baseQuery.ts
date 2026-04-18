import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { login, logout } from '../store/reducers/userSlice';

export const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api',
    credentials: 'include', // sends cookies with every request
});

/**
 * Wraps baseQuery with automatic token refresh.
 * Since JWTs are stored in HttpOnly cookies, we can't access them in JS.
 * On a 401, we call /auth/refresh (which sets a new access-token cookie),
 * then retry the original request.
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
    async (args, api, extraOptions) => {
        let result = await baseQuery(args, api, extraOptions);

        if (result.error && result.error.status === 401) {
            // Attempt to refresh the access token via the refresh-token cookie
            const refreshResult = await baseQuery(
                { url: '/auth/refresh', method: 'POST' },
                api,
                extraOptions,
            );

            if (refreshResult.error) {
                // Refresh failed — user is no longer authenticated
                api.dispatch(logout());
            } else {
                // New access-token cookie has been set by the server — retry
                api.dispatch(login());
                result = await baseQuery(args, api, extraOptions);
            }
        }

        return result;
    };
