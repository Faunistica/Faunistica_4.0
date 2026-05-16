// src/components/sidebar/RecordStatusIndicator.tsx
import { type FC } from 'react';
import { CheckCircle2, AlertCircle, CircleDashed, Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useRecordStatus } from '@/hooks/useRecordStatus';
import { BLOCKING_FIELDS, getFieldLabel } from '@/types/forms';
import { useFormContext } from 'react-hook-form';
import type { FormSchema } from '@/types/forms';

interface Props {
    index: number;
    sample: any;
    validationErrors?: Map<number, string[]>;
}

const STATUS_CONFIG = {
    empty: {
        Icon: Circle,
        color: 'text-slate-300',
        label: 'Не заполнено',
        pulse: false,
    },
    draft: {
        Icon: CircleDashed,
        color: 'text-blue-400',
        label: 'Заполняется...',
        pulse: false,
    },
    valid: {
        Icon: CheckCircle2,
        color: 'text-emerald-500',
        label: 'Готово',
        pulse: false,
    },
    error: {
        Icon: AlertCircle,
        color: 'text-red-500 animate-pulse',
        label: 'Есть обязательные поля',
        pulse: true,
    },
} as const;

export const RecordStatusIndicator: FC<Props> = ({ index, sample, validationErrors }) => {
    const status = useRecordStatus(index, sample, validationErrors);
    const { formState: { errors } } = useFormContext<FormSchema>();
    const config = STATUS_CONFIG[status];

    // Для тултипа: какие именно поля не заполнены
    const externalErrors = validationErrors?.get(index);
    const sampleErrors = errors.samples?.[index] as Record<string, any> | undefined;

    let missingFields: string[] = [];
    if (status === 'error') {
        if (externalErrors && externalErrors.length > 0) {
            missingFields = externalErrors;
        } else if (sampleErrors) {
            missingFields = BLOCKING_FIELDS.filter(f => sampleErrors[f as keyof typeof sampleErrors])
                .map(f => getFieldLabel(f));
        }
    }

    const tooltipContent = status === 'error' && missingFields.length > 0
        ? `Заполните: ${missingFields.join(', ')}`
        : config.label;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <config.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${config.color}`} />
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs max-w-[200px]">
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
