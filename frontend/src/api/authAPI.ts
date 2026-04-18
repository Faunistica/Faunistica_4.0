import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as Types from '../types/api.dto.ts';
import { login, logout } from "../store/reducers/userSlice.ts";

export const authAPI = createApi({
    reducerPath: 'authAPI',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8000/api' }),
    tagTypes: ['auth'],
    endpoints: (build) => ({
        login: build.mutation<void, Types.UserRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['auth'],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(login(data));
                } catch {
                    dispatch(logout());
                }
            }
        }),
        refreshToken: build.mutation<void, void>({
            query: () => ({
                url: '/auth/refresh',
                method: 'POST',
            }),
        }),
        checkAuth: build.query<void, void>({
            query: () => ({
                url: '/auth/check',
                method: 'POST',
            }),
        }),
        logout: build.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['auth']
        }),
    }),
})
