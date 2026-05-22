import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto';
import { baseQueryWithReauth } from './baseQuery';

export const recordAPI = createApi({
    reducerPath: 'recordAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['record'],
    endpoints: (build) => ({
        getRecordsData: build.query<
            Types.PaginatedResponse<Types.RecordFull>,
            Types.RecordListRequest
        >({
            query: (params) => ({
                url: '/records/',
                method: 'GET',
                params: params,
            }),
            providesTags: ['record'],
        }),
        getRecordById: build.query<Types.RecordFull, Types.RecordIdRequest>({
            query: ({ record_id }) => ({
                url: `/records/${record_id}`,
                method: 'GET',
            }),
        }),
        createRecord: build.mutation<Types.RecordFull, Types.CreateRecordRequest>({
            query: (record) => ({
                url: '/records/',
                method: 'POST',
                body: record,
            }),
            invalidatesTags: ['record'],
        }),
        editRecord: build.mutation<Types.UpdateRecordResponse, Types.EditRecordRequest>({
            query: ({ record_id, data }) => ({
                url: `/records/${record_id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteRecord: build.mutation<void, Types.RecordIdRequest>({
            query: ({ record_id }) => ({
                url: `/records/${record_id}`,
                method: 'DELETE',
            }),
        }),
        exportRecords: build.mutation<
            Blob,
            { user_id: number; publ_id?: number; scope?: string; format?: string }
        >({
            query: (params) => ({
                url: '/records/export',
                method: 'GET',
                params,
                responseHandler: (response) => response.blob(),
            }),
        }),
        importRecords: build.mutation<Types.ImportResult, FormData>({
            query: (formData) => ({
                url: '/records/import',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['record'],
        }),
    }),
});

export const {
    useGetRecordsDataQuery,
    useGetRecordByIdQuery,
    useCreateRecordMutation,
    useEditRecordMutation,
    useDeleteRecordMutation,
    useExportRecordsMutation,
    useImportRecordsMutation,
} = recordAPI;
