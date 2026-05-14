import { createApi } from "@reduxjs/toolkit/query/react";
import * as Types from '../types/api.dto.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const publAPI = createApi({
    reducerPath: 'publAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['publications'],
    endpoints: (build) => ({
        getCurrentPublication: build.query<Types.Publication[], { list: boolean }>({
            query: ({ list }) => `/publications/current/?list_all=${list}`,
        }),
        getPublicationById: build.query<Types.Publication, number>({
            query: (id) => `/publications/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'publications', id }],
        }),
    }),
});

export const { useGetCurrentPublicationQuery, useGetPublicationByIdQuery } = publAPI;