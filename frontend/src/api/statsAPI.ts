import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const statsAPI = createApi({
    reducerPath: 'statsAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['stats'],
    endpoints: (build) => ({
        getGeneralStats: build.query<Types.StatisticsResponse, void>({
            query: () => '/statistics/project',
            providesTags: ['stats'],
        }),
        getUserStats: build.query<Types.UserStatisticsResponse, number>({
            query: (userId) => `/statistics/users?user_id=${userId}`,
            providesTags: ['stats'],
        }),
    }),
});
