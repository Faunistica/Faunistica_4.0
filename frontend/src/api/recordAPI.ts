import { createApi } from "@reduxjs/toolkit/query/react";
import * as Types from '../types/api.dto';
import { baseQueryWithReauth } from './baseQuery';

export const recordAPI = createApi({
    reducerPath: 'recordAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['record'],
    endpoints: (build) => ({
        getRecordsData: build.query<Types.PaginatedResponse<Types.RecordFull>, Types.RecordListRequest>({
            query: (params) => ({
                url: '/records/',
                method: 'GET',
                params: params,
            }),
            providesTags: ['record']
        }),
        getRecordById: build.query<Types.RecordFull, Types.RecordIdRequest>({
            query: ({ record_id, user_id }) => ({
                url: `/records/${record_id}`,
                method: 'GET',
                params: { user_id },
            }),
        }),
        createRecord: build.mutation<Types.RecordFull, Types.RecordBelonging>({
            query: (record) => ({
                url: '/records/',
                method: 'POST',
                body: record,
            }),
            invalidatesTags: ['record']
        }),
        editRecord: build.mutation<Types.RecordFull, Types.EditRecordRequest>({
            query: ({ record_id, user_id, ...recordData }) => ({
                url: `/records/${record_id}`,
                method: 'PUT',
                params: { user_id },
                body: recordData,
            }),
        }),
        deleteRecord: build.mutation<void, Types.RecordIdRequest>({
            query: ({ record_id, user_id }) => ({
                url: `/records/${record_id}`,
                method: 'DELETE',
                params: { user_id },
            }),
        }),
    }),
});

export const {
    useGetRecordsDataQuery,
    useGetRecordByIdQuery,
    useCreateRecordMutation,
    useEditRecordMutation,
    useDeleteRecordMutation
} = recordAPI;