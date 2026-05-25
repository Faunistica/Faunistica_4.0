import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto';
import { baseQueryWithReauth } from './baseQuery';

export const recordAPI = createApi({
    reducerPath: 'recordAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['records-list'],
    endpoints: (build) => ({
        recordsList: build.query<
            Types.PaginatedResponse<Types.RecordFull>,
            Types.RecordListRequest
        >({
            query: (params) => ({
                url: '/records',
                method: 'GET',
                params: params,
            }),
            providesTags: ['records-list'],
            onQueryStarted: async (_params, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    for (const item of data.items) {
                        void dispatch(
                            recordAPI.util.upsertQueryData(
                                'recordById',
                                { record_id: item.id },
                                item,
                            ),
                        );
                    }
                } catch {
                    // cache warm-up is best-effort
                }
            },
        }),
        recordById: build.query<Types.RecordFull, Types.RecordIdRequest>({
            query: ({ record_id }) => ({
                url: `/records/${record_id}`,
                method: 'GET',
            }),
        }),
        createRecord: build.mutation<Types.RecordFull, Types.CreateRecordRequest>({
            query: (record) => ({
                url: '/records',
                method: 'POST',
                body: record,
            }),
            invalidatesTags: ['records-list'],
        }),
        editRecord: build.mutation<Types.UpdateRecordResponse, Types.EditRecordRequest>({
            query: ({ record_id, data }) => ({
                url: `/records/${record_id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['records-list'],
        }),
        deleteRecord: build.mutation<void, Types.RecordIdRequest>({
            query: ({ record_id }) => ({
                url: `/records/${record_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['records-list'],
        }),
        submitRecord: build.mutation<Types.UpdateRecordResponse, Types.EditRecordRequest>({
            query: ({ record_id, data }) => ({
                url: `/records/${record_id}/submit`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['records-list'],
        }),
        downloadRecords: build.mutation<
            null,
            { user_id: number; publ_id?: number; scope?: string; format?: string }
        >({
            queryFn: async (params, _api, _extraOptions, baseQuery) => {
                const result = await baseQuery({
                    url: '/records/export',
                    method: 'GET',
                    params,
                    responseHandler: (response: Response) => response.blob(),
                });

                if (result.error) return { error: result.error };

                // oxlint-disable-next-line typescript/no-unsafe-type-assertion
                const blob = result.data as Blob;
                const url = window.URL.createObjectURL(blob);
                Object.assign(document.createElement('a'), {
                    href: url,
                    download: `данные_faunistica_${params.publ_id || 'все'}.xlsx`,
                }).click();
                window.URL.revokeObjectURL(url);

                // RTK query wouldn't cache a blob
                return { data: null };
            },
        }),
        uploadExcel: build.mutation<Types.UploadExcelResponse, FormData>({
            query: (formData) => ({
                url: '/records/import',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['records-list'],
        }),
    }),
});

export const {
    useRecordsListQuery,
    useRecordByIdQuery,
    useLazyRecordByIdQuery,
    useCreateRecordMutation,
    useEditRecordMutation,
    useDeleteRecordMutation,
    useSubmitRecordMutation,
    useDownloadRecordsMutation,
    useUploadExcelMutation,
} = recordAPI;
