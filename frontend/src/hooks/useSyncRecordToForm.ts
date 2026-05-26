import { useEffect, useRef } from 'react';
import type { RecordFull } from '@/types/api.dto';

type SetFormValues = (record: RecordFull) => void;

export function useSyncRecordToForm(
  record: RecordFull | undefined,
  setFormValues: SetFormValues,
) {
  const prevRecordIdRef = useRef<string | undefined>(undefined);
  const prevUpdatedAtRef = useRef<string | undefined>(undefined);
  const callbackRef = useRef(setFormValues);
  callbackRef.current = setFormValues;

  useEffect(() => {
    if (!record) return;

    const isNewRecord = record.id !== prevRecordIdRef.current;
    const isNewData = record.updated_at !== prevUpdatedAtRef.current;

    if (isNewRecord || isNewData) {
      prevRecordIdRef.current = record.id;
      prevUpdatedAtRef.current = record.updated_at;
      callbackRef.current(record);
    }
  }, [record]);
}
