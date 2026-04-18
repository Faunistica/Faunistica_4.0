import { createApi } from "@reduxjs/toolkit/query/react";
import * as Types from '../types/api.dto.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const utilAPI = createApi({
    reducerPath: 'utilAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['util'],
    endpoints: (build) => ({
        suggestTaxon: build.mutation<Types.SuggestTaxonResponse, Types.SuggestTaxonRequest>({
            query: (payload) => ({
                url: '/taxonomy/suggest',
                method: 'POST',
                body: payload,
            }),
        }),
        autofillTaxon: build.mutation<Types.AutofillTaxonResponse, Types.AutofillTaxonRequest>({
            query: (payload) => ({
                url: '/taxonomy/autofill',
                method: 'POST',
                body: payload,
            }),
        }),
        geoSearch: build.mutation<Types.SuggestTaxonResponse, Types.GeoSearchRequest>({
            query: (payload) => ({
                url: '/geo/search',
                method: 'POST',
                body: payload,
            }),
        }),
        parseInfoFromText: build.mutation<Types.InfoResponse, Types.InfoRequest>({
            query: (payload) => ({
                url: '/get_info',
                method: 'POST',
                body: payload,
            }),
        }),
        getLocationByCoords: build.mutation<Types.GetLocationResponse, Types.GetLocationRequest>({
            query: (payload) => ({
                url: '/geo/reverse-geocode',
                method: 'POST',
                body: payload,
            }),
        }),
        getUserPhoto: build.query<any, number>({
            query: (userId) => ({
                url: '/users/me/photo',
                params: { user_id: userId }
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
})