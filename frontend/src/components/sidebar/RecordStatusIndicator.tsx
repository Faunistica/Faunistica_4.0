import { type FC } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, CircleDashed, Circle } from 'lucide-react';
import type { RecordStatus } from '@/hooks/useRecordStatus';

const STATUS_CONFIG: Record<
    RecordStatus,
    { Icon: FC<{ className?: string }>; color: string; label: string }
> = {
    empty: {
        Icon: Circle,
        color: 'text-slate-300',
        label: 'Не заполнено',
    },
    draft: {
        Icon: CircleDashed,
        color: 'text-blue-400',
        label: 'Заполняется...',
    },
    valid: {
        Icon: CheckCircle2,
        color: 'text-emerald-500',
        label: 'Готово',
    },
    error: {
        Icon: AlertCircle,
        color: 'text-red-500',
        label: 'Есть ошибки',
    },
};

interface Props {
    status: RecordStatus;
}

export const RecordStatusIndicator: FC<Props> = ({ status }) => {
    const { Icon, color, label } = STATUS_CONFIG[status];

    return (
        <span className={cn('inline-flex items-center gap-1', color)} title={label}>
            <Icon className="h-3.5 w-3.5" />
        </span>
    );
};
