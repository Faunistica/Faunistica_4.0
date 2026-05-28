import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto';
import { baseQueryWithReauth } from './baseQuery';

export const utilAPI = createApi({
    reducerPath: 'utilAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['util'],
    endpoints: (build) => ({
        suggestTaxon: build.query<Types.SuggestTaxonResponse, Types.SuggestTaxonRequest>({
            query: ({ field, text, family, genus }) => ({
                url: '/taxonomy/suggest',
                method: 'GET',
                params: { field, text, ...(family ? { family } : {}), ...(genus ? { genus } : {}) },
            }),
        }),
        autofillTaxon: build.query<Types.AutofillTaxonResponse, Types.AutofillTaxonRequest>({
            query: ({ field, text }) => ({
                url: '/taxonomy/autofill',
                method: 'GET',
                params: { field, text },
            }),
        }),
        geoSearch: build.query<Types.GeoSearchResponse, Types.GeoSearchRequest>({
            query: ({ field, text, region }) => ({
                url: '/geo/search',
                method: 'GET',
                params: { field, text, ...(region ? { region } : {}) },
            }),
        }),
        getLocationByCoords: build.query<Types.GetLocationResponse, Types.GetLocationRequest>({
            query: (params) => ({
                url: '/geo/reverse-geocode',
                method: 'GET',
                params,
            }),
        }),
        sendSupportRequest: build.mutation<void, Types.SupportRequest>({
            query: (payload) => ({
                url: '/support',
                method: 'POST',
                body: payload,
            }),
        }),
    }),
});

export const {
    useLazySuggestTaxonQuery,
    useLazyAutofillTaxonQuery,
    useLazyGeoSearchQuery,
    useLazyGetLocationByCoordsQuery,
    useSendSupportRequestMutation,
} = utilAPI;
