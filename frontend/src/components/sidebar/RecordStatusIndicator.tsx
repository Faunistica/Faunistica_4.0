// src/components/sidebar/RecordStatusIndicator.tsx
//
// Показывает иконку статуса записи в сайдбаре.
// НЕ использует useFormState — это критично для производительности,
// т.к. useFormState подписывается на ВСЕ изменения ошибок формы
// и вызывает ререндер КАЖДОГО индикатора при изменении ЛЮБОГО поля.

import { type FC } from 'react';
import { CheckCircle2, AlertCircle, CircleDashed, Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useRecordStatus } from '@/hooks/useRecordStatus';
import { getFieldLabel } from '@/types/forms';

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
        color: 'text-red-500 animate-pulse',
        label: 'Есть обязательные поля',
    },
} as const;

export const RecordStatusIndicator: FC<Props> = ({ index, sample, validationErrors }) => {
    // Статус определяется через:
    // 1) validationErrors Map (от кнопки «Проверить всё»)
    // 2) sample.type (от бекенда, проставляется при сохранении)
    // 3) Наличие заполненных required-полей (empty / draft)
    const status = useRecordStatus(index, sample, validationErrors);
    const config = STATUS_CONFIG[status];

    // Собираем список проблемных полей для тултипа
    let missingFields: string[] = [];
    if (status === 'error') {
        const externalErrors = validationErrors?.get(index);
        if (externalErrors && externalErrors.length > 0) {
            // Из «Проверить всё»
            missingFields = externalErrors;
        } else if (sample?.errors) {
            // Из ответа бекенда (JSON-строка)
            try {
                const apiErrors = JSON.parse(sample.errors);
                missingFields = apiErrors
                    .flatMap((e: any) => e.fields || [])
                    .map((f: string) => getFieldLabel(f));
            } catch {
                missingFields = [sample.errors];
            }
        }
    }

    const tooltipContent =
        status === 'error' && missingFields.length > 0
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
