import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const statsAPI = createApi({
    reducerPath: 'statsAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['stats'],
    endpoints: (build) => ({
        getGeneralStats: build.query<Types.StatisticsResponse, void>({
            query: () => '/stats/general',
            providesTags: ['stats'],
        }),
        getPersonalStats: build.query<any, void>({
            query: () => '/users/me',
            providesTags: ['stats'],
        }),
    }),
});
