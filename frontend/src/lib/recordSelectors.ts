import { createSelector } from '@reduxjs/toolkit';
import { capitalizeFirstLetter } from '@/lib/utils';
import { computeRecordStatus } from '@/lib/recordStatus';
import type { RecordFull } from '@/types/domain';
import i18n from 'i18next';

export const selectRecordSummary = createSelector(
    [(result: { data?: RecordFull }) => result.data],
    (record) => ({
        status: record ? computeRecordStatus(record) : 'empty',
        recordName: capitalizeFirstLetter(
            record?.species ||
                record?.genus ||
                record?.family ||
                i18n.t('recordSelectors.newRecord'),
        ),
        recordLocation: record?.locality || record?.region || i18n.t('recordSelectors.noLocation'),
    }),
);
