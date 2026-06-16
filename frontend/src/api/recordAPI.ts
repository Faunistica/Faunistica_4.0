import { createApi } from '@reduxjs/toolkit/query/react';
import * as Types from '../types/api.dto';
import { baseQueryWithReauth } from './baseQuery';
import { publAPI } from './publAPI';

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
            onQueryStarted: async ({ publ_id }, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    void dispatch(
                        recordAPI.util.upsertQueryData('recordById', { record_id: data.id }, data),
                    );
                    dispatch(
                        publAPI.util.invalidateTags([
                            { type: 'publications', id: `draft-${publ_id}` },
                        ]),
                    );
                } catch {
                    // best-effort
                }
            },
        }),
        updateRecord: build.mutation<Types.RecordFull, Types.UpdateRecordRequest>({
            query: ({ record_id, submit, data }) => ({
                url: `/records/${record_id}` + (submit ? '/submit' : ''),
                method: 'PUT',
                body: data,
            }),
            onQueryStarted: async ({ record_id, publ_id }, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    if (!data) return;
                    dispatch(
                        recordAPI.util.updateQueryData(
                            'recordsList',
                            { publ_id: data.publ_id } as Types.RecordListRequest,
                            (draft) => {
                                const idx = draft.items.findIndex((r) => r.id === record_id);
                                if (idx !== -1) draft.items[idx] = data;
                            },
                        ),
                    );
                    void dispatch(
                        recordAPI.util.upsertQueryData('recordById', { record_id }, data),
                    );
                    if (publ_id) {
                        dispatch(
                            publAPI.util.invalidateTags([
                                { type: 'publications', id: `draft-${publ_id}` },
                            ]),
                        );
                    }
                } catch {
                    // mutation failed — RTK handles rollback automatically
                }
            },
        }),
        deleteRecord: build.mutation<void, Types.RecordIdRequest & { publ_id: number }>({
            query: ({ record_id }) => ({
                url: `/records/${record_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['records-list'],
            onQueryStarted: async ({ record_id, publ_id }, { dispatch, queryFulfilled }) => {
                const patch = dispatch(
                    recordAPI.util.updateQueryData(
                        'recordsList',
                        { publ_id } as Types.RecordListRequest,
                        (draft) => {
                            draft.items = draft.items.filter((item) => item.id !== record_id);
                            draft.total = Math.max(0, draft.total - 1);
                        },
                    ),
                );
                try {
                    await queryFulfilled;
                    dispatch(
                        publAPI.util.invalidateTags([
                            { type: 'publications', id: `draft-${publ_id}` },
                        ]),
                    );
                } catch {
                    patch.undo();
                }
            },
        }),
        downloadRecords: build.mutation<
            null,
            { user_id?: number; publ_id: number; scope?: string; format?: string }
        >({
            queryFn: async (params, _api, _extraOptions, baseQuery) => {
                const result = await baseQuery({
                    url: '/records/export',
                    method: 'GET',
                    params,
                    responseHandler: (response: Response) => response.blob(),
                });

                if (result.error) return { error: result.error };

                if (!(result.data instanceof Blob)) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Expected Blob response' } };
                }
                const blob = result.data;
                const url = window.URL.createObjectURL(blob);
                Object.assign(document.createElement('a'), {
                    href: url,
                    download: `data_faunistics_${params.publ_id || 'all'}.xlsx`,
                }).click();
                window.URL.revokeObjectURL(url);

                // RTK query wouldn't cache a blob
                return { data: null };
            },
        }),
        exportAllRecords: build.mutation<null, void>({
            queryFn: async (_params, _api, _extraOptions, baseQuery) => {
                const result = await baseQuery({
                    url: '/records/export-all',
                    method: 'GET',
                    responseHandler: (response: Response) => response.blob(),
                });

                if (result.error) return { error: result.error };

                if (!(result.data instanceof Blob)) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Expected Blob response' } };
                }

                const blob = result.data;
                const url = window.URL.createObjectURL(blob);
                Object.assign(document.createElement('a'), {
                    href: url,
                    download: 'faunistica_data.xlsx',
                }).click();
                window.URL.revokeObjectURL(url);

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
    useUpdateRecordMutation,
    useDeleteRecordMutation,
    useDownloadRecordsMutation,
    useExportAllRecordsMutation,
    useUploadExcelMutation,
} = recordAPI;
