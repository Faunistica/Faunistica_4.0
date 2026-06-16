import { type FC } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, CircleDashed, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RecordStatus } from '@/lib/recordStatus';

const STATUS_CONFIG: Record<RecordStatus, { Icon: FC<{ className?: string }>; color: string }> = {
    empty: {
        Icon: Circle,
        color: 'text-slate-300',
    },
    draft: {
        Icon: CircleDashed,
        color: 'text-blue-400',
    },
    valid: {
        Icon: CheckCircle2,
        color: 'text-emerald-500',
    },
    error: {
        Icon: AlertCircle,
        color: 'text-red-500',
    },
};

interface Props {
    status: RecordStatus;
}

export const RecordStatusIndicator: FC<Props> = ({ status }) => {
    const { t } = useTranslation();
    const { Icon, color } = STATUS_CONFIG[status];

    return (
        <span
            className={cn('inline-flex items-center gap-1', color)}
            title={t(`form.recordStatus.${status}`)}
        >
            <Icon className="size-3.5" />
        </span>
    );
};
