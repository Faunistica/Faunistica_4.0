import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as Types from '../types/api.dto.ts';

export const publAPI = createApi({
    reducerPath: 'publAPI',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8000/api' }),
    tagTypes: ['publ'],
    endpoints: (build) => ({
        getPublications: build.query<any, void>({
            query: () => '/users/publication',
        }),
        getNextPublication: build.query<any, void>({
            query: () => '/users/publication/next',
        }),
        getPublicationFromHash: build.query<any, Types.RecordHashRequest>({
            query: (payload) => ({
                url: '/users/from-hash',
                method: 'POST',
                body: payload,
            }),
        }),
    }),
})