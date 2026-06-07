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
        downloadReport: build.mutation<null, void>({
            queryFn: async (_params, _api, _extraOptions, baseQuery) => {
                const result = await baseQuery({
                    url: '/statistics/report',
                    method: 'GET',
                    responseHandler: (response: Response) => response.blob(),
                });

                if (result.error) return { error: result.error };

                if (!(result.data instanceof Blob)) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Expected Blob response' } };
                }

                const blob = result.data;
                const url = window.URL.createObjectURL(blob);
                const today = new Date().toISOString().split('T')[0];
                Object.assign(document.createElement('a'), {
                    href: url,
                    download: `Report_${today}.xlsx`,
                }).click();
                window.URL.revokeObjectURL(url);

                return { data: null };
            },
        }),
    }),
});
