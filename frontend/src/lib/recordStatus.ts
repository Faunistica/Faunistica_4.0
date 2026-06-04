import { BLOCKING_FIELDS } from '@/lib/constants';
import { toFormPartial } from '@/lib/recordUtils';
import type { FieldErrors } from 'react-hook-form';
import type { RecordForm } from '@/types/forms';
import type { RecordFull } from '@/types/api.dto';

export type RecordStatus = 'empty' | 'draft' | 'valid' | 'error';

function computeFromFormValues(values: Partial<RecordForm>): RecordStatus {
    const hasAnyValue = BLOCKING_FIELDS.some((field) => {
        const val = values[field as keyof RecordForm];
        return val !== undefined && val !== null && val !== '';
    });

    if (!hasAnyValue) {
        return 'empty';
    }

    const allBlockingFilled = BLOCKING_FIELDS.every((field) => {
        const val = values[field as keyof RecordForm];
        return val !== undefined && val !== null && val !== '';
    });

    if (allBlockingFilled) return 'valid';

    return 'draft';
}

export function computeActiveStatus(
    values: Partial<RecordForm>,
    errors: FieldErrors<RecordForm>,
): RecordStatus {
    if (Object.keys(errors).length > 0) return 'error';
    return computeFromFormValues(values);
}

export function computeRecordStatus(record: RecordFull): RecordStatus {
    const serverType = record.type;

    if (serverType === 'rec_ok') return 'valid';
    if (serverType === 'check_ok') return 'draft';
    if (serverType === 'rec_fail') return 'error';

    if (serverType === 'check_fail') {
        const allBlockingFilled = BLOCKING_FIELDS.every((field) => {
            const val = record[field as keyof RecordFull];
            return val !== undefined && val !== null && val !== '';
        });
        return allBlockingFilled ? 'error' : 'draft';
    }

    return computeFromFormValues(toFormPartial(record));
}
