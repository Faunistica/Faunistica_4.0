import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useRecordsListQuery } from '@/api/recordAPI';
import { useRecordIDs } from '@/hooks/useRecordIDs';

export function useRecordPublGuard(publ_id: number): { isValidating: boolean } {
    const { record: recordParam } = useParams<{ record: string }>();
    const navigate = useNavigate();

    const recordIds = useRecordIDs(publ_id);
    const { isLoading: isListLoading } = useRecordsListQuery(
        { publ_id },
        { selectFromResult: ({ isLoading }) => ({ isLoading }) },
    );

    const isValidRecord = !recordParam || recordIds.includes(recordParam);
    const isValidating = Boolean(recordParam) && (isListLoading || !isValidRecord);

    useEffect(() => {
        if (isListLoading || !recordParam) return;

        if (recordIds.length > 0 && !recordIds.includes(recordParam)) {
            void navigate(`/publication/${publ_id}/${recordIds[0]}`, { replace: true });
        } else if (recordIds.length === 0) {
            void navigate(`/publication/${publ_id}`, { replace: true });
        }
    }, [isListLoading, recordParam, recordIds, publ_id, navigate]);

    return { isValidating };
}
