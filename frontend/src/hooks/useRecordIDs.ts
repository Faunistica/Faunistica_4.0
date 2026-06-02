import { useRecordsListQuery, selectRecordIDs } from '@/api/recordAPI';

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
