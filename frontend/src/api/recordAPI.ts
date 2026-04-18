import { createApi } from "@reduxjs/toolkit/query/react";
import * as Types from '../types/api.dto.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const recordAPI = createApi({
    reducerPath: 'recordAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['record'],
    endpoints: (build) => ({
        getRecordsData: build.query<any, void>({
            query: () => ({
                url: '/records/',
                method: 'GET',
            }),
            providesTags: ['record']
        }),
        getRecordByHash: build.query<Types.GetRecordResponse, Types.RecordHashRequest>({
            query: (payload) => ({
                url: `/records/${payload.hash}`,
                method: 'GET',
            }),
        }),
        insertRecord: build.mutation<void, Types.InsertRecordsRequest>({
            query: (record) => ({
                url: '/records/',
                method: 'POST',
                body: record,
            }),
            invalidatesTags: ['record']
        }),
        editRecord: build.mutation<void, Types.EditRecordRequest>({
            query: (record) => ({
                url: `/records/${record.hash}`,
                method: 'PUT',
                body: record,
            }),
            invalidatesTags: ['record']
        }),
        deleteRecord: build.mutation<void, Types.RecordHashRequest>({
            query: (payload) => ({
                url: `/records/${payload.hash}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['record']
        }),
    }),
})