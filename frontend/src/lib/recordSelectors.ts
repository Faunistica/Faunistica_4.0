import { createSelector } from '@reduxjs/toolkit';
import { capitalizeFirstLetter } from '@/lib/utils';
import { computeRecordStatus } from '@/lib/recordStatus';
import type { RecordFull } from '@/types/domain';

export const selectRecordSummary = createSelector(
    [(result: { data?: RecordFull }) => result.data],
    (record) => ({
        status: record ? computeRecordStatus(record) : 'empty',
        recordName: capitalizeFirstLetter(
            record?.species || record?.genus || record?.family || 'Новая запись',
        ),
        recordLocation: record?.locality || record?.region || 'Нет данных о месте',
    }),
);
