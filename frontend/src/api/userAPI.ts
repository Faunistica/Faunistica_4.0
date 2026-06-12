import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const userAPI = createApi({
    reducerPath: 'userAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['User'],
    endpoints: (build) => ({
        getMe: build.query<Types.UserFull, void>({
            query: () => ({
                url: '/users/me',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),
        updateMe: build.mutation<Types.UserFull, Types.UserUpdateMeRequest>({
            query: (data) => ({
                url: '/users/me',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        getPhoto: build.query<Blob, void>({
            query: () => ({
                url: '/users/photo',
                method: 'GET',
                responseHandler: (response: Response) => response.blob(),
            }),
            providesTags: ['User'],
        }),
    }),
});

export const { useGetMeQuery, useUpdateMeMutation, useGetPhotoQuery } = userAPI;
