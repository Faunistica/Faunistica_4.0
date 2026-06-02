import { useRecordsListQuery } from '@/api/recordAPI';
import * as Types from '../types/api.dto';
import { createSelector } from '@reduxjs/toolkit';

export const selectRecordIDs = createSelector(
    [(result: { data?: Types.PaginatedResponse<Types.RecordFull> }) => result.data],
    (data) => data?.items?.map((r) => r.id) ?? [],
    {
        memoizeOptions: {
            resultEqualityCheck: (a: string[], b: string[]) =>
                a.length === b.length && a.every((id, i) => id === b[i]),
        },
    },
);

export function useRecordIDs(publ_id: number): string[] {
    const { recordIds } = useRecordsListQuery(
        { publ_id },
        {
            selectFromResult: ({ data }) => ({
                recordIds: selectRecordIDs({ data }),
            }),
        },
    );
    return recordIds;
}
