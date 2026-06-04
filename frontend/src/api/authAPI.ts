import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto.ts';
import { login, logout } from '../store/reducers/userSlice.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const authAPI = createApi({
    reducerPath: 'authAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['auth'],
    endpoints: (build) => ({
        login: build.mutation<Types.UserLoginResponse, Types.LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['auth'],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        login({
                            name: data.name,
                            user_id: data.user_id,
                        }),
                    );
                } catch {
                    dispatch(logout());
                }
            },
        }),
        refreshToken: build.mutation<void, void>({
            query: () => ({
                url: '/auth/refresh',
                method: 'POST',
            }),
        }),
        /**
         * Used on app startup to verify whether the user has a valid session
         * (access-token cookie). If the server returns 200, the user is logged in.
         * The baseQueryWithReauth wrapper will automatically attempt a token
         * refresh if the access token is expired but the refresh token is still valid.
         */
        checkAuth: build.query<Types.UserInfo, void>({
            query: () => ({
                url: '/auth/check',
                method: 'POST',
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        login({
                            name: data.name,
                            user_id: data.user_id,
                        }),
                    );
                } catch {
                    dispatch(logout());
                }
            },
        }),
        logout: build.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['auth'],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                } finally {
                    dispatch(logout());
                }
            },
        }),
        initTelegramAuth: build.mutation<Types.TelegramAuthInitResponse, void>({
            query: () => ({
                url: '/auth/telegram/',
                method: 'POST',
            }),
        }),
        checkTelegramAuthStatus: build.query<
            Types.TelegramAuthStatusResponse,
            { token: string; timeout: number }
        >({
            query: ({ token, timeout }) => ({
                url: `/auth/telegram/status?token=${token}&timeout=${timeout}`,
                method: 'GET',
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.status === 'authorized' && data.user_id && data.username) {
                        dispatch(
                            login({
                                name: data.username,
                                user_id: data.user_id,
                            })
                        );
                    }
                } catch {
                    // Ignore errors for polling
                }
            },
        }),
        register: build.mutation<Types.RegisterResponse, Types.RegisterRequest>({
            query: (userData) => ({
                url: '/auth/register/',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['auth'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        login({
                            name: arg.username,
                            user_id: data.user_id,
                        })
                    );
                } catch {
                    dispatch(logout());
                }
            },
        }),
    }),
});

export const {
    useLoginMutation,
    useRefreshTokenMutation,
    useCheckAuthQuery,
    useLogoutMutation,
    useInitTelegramAuthMutation,
    useCheckTelegramAuthStatusQuery,
    useLazyCheckTelegramAuthStatusQuery,
    useRegisterMutation,
} = authAPI;
