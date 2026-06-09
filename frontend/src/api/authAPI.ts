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
                            username: data.username ?? null,
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
                url: '/auth/code',
                method: 'POST',
            }),
        }),
        checkTelegramAuthStatus: build.query<
            Types.TelegramAuthStatusResponse,
            { code: string; token: string; timeout: number }
        >({
            query: ({ code, token, timeout }) => ({
                url: `/auth/code/status?code=${code}&token=${token}&time_out=${timeout}`,
                method: 'GET',
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (
                        (data.status === 'authorized' || data.status === 1) &&
                        data.user_id &&
                        data.name
                    ) {
                        dispatch(
                            login({
                                name: data.name,
                                username: data.username ?? null,
                                user_id: data.user_id,
                            }),
                        );
                    }
                } catch {
                    // Ignore errors for polling
                }
            },
        }),
        getBotUrl: build.query<{ bot_url: string }, void>({
            query: () => ({
                url: '/auth/bot-url',
                method: 'GET',
            }),
        }),
        register: build.mutation<Types.RegisterResponse, Types.RegisterRequest>({
            query: (userData) => ({
                url: '/auth/survey',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['auth'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        login({
                            name: arg.name,
                            username: arg.username,
                            user_id: data.user_id,
                        }),
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
    useLogoutMutation,
    useInitTelegramAuthMutation,
    useCheckTelegramAuthStatusQuery,
    useLazyCheckTelegramAuthStatusQuery,
    useGetBotUrlQuery,
    useRegisterMutation,
} = authAPI;
