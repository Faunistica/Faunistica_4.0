import { type FC } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Hash } from 'lucide-react';
import { QUANTITY_FIELD_LABELS, QUANTITY_TYPE_OPTIONS } from '@/types/constants';
import type { FormRecord } from '@/types/api.dto';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const QuantitiesCard: FC = () => {
    const { control } = useFormContext<FormRecord>();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const total = useWatch<FormRecord>({
        name: ['males', 'subadultMales', 'females', 'subadultFemales', 'adults', 'juveniles'],
        compute: (data) =>
            data.reduce<number>((sum, v) => {
                // Handle both numbers and strings from form inputs
                if (typeof v == 'boolean') {
                    return 0;
                }
                const num = typeof v === 'string' ? parseFloat(v) : v;
                return sum + (num || 0);
            }, 0),
    }) as number;

    const quantityFields = [
        { key: 'males' as const, label: QUANTITY_FIELD_LABELS.males, color: 'text-blue-600' },
        {
            key: 'subadultMales' as const,
            label: QUANTITY_FIELD_LABELS.subadultMales,
            color: 'text-blue-400',
        },
        { key: 'females' as const, label: QUANTITY_FIELD_LABELS.females, color: 'text-pink-600' },
        {
            key: 'subadultFemales' as const,
            label: QUANTITY_FIELD_LABELS.subadultFemales,
            color: 'text-pink-400',
        },
        { key: 'adults' as const, label: QUANTITY_FIELD_LABELS.adults, color: 'text-slate-600' },
        {
            key: 'juveniles' as const,
            label: QUANTITY_FIELD_LABELS.juveniles,
            color: 'text-amber-600',
        },
    ];

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex gap-2 md:items-center">
                    <div className="flex size-8 rounded-lg bg-rose-50 p-2 text-rose-600">
                        <Hash className="size-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                        Количественные характеристики
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {quantityFields.map(({ key, label, color }) => (
                        <Controller
                            name={key}
                            key={key}
                            control={control}
                            render={({ field, fieldState: { error, invalid } }) => (
                                <Field data-invalid={invalid} className="gap-1.5">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <FieldLabel
                                                htmlFor={key}
                                                className={cn(
                                                    'text-[10px] font-semibold tracking-wider uppercase',
                                                    color,
                                                    'cursor-help truncate',
                                                )}
                                            >
                                                {label}
                                            </FieldLabel>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                            {label}
                                        </TooltipContent>
                                    </Tooltip>
                                    <Input
                                        id={key}
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        className="h-9 text-center focus-visible:ring-1 focus-visible:ring-slate-300"
                                        aria-invalid={invalid}
                                        {...field}
                                        value={field.value?.toString()}
                                    />
                                    <FieldError errors={[error]} />
                                </Field>
                            )}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
                    <Controller
                        name="quantity_type"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Единицы измерения</FieldLabel>
                                <Select
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Выберите единицы" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUANTITY_TYPE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                    <Field>
                        <FieldLabel>Общее количество (вычислено)</FieldLabel>
                        <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                            {total > 0 ? total : '—'}
                        </div>
                    </Field>
                </div>

                <Controller
                    name="occurrence_remarks"
                    control={control}
                    render={({ field, fieldState: { error, invalid } }) => (
                        <Field data-invalid={invalid}>
                            <FieldLabel htmlFor="occurrence_remarks">
                                Примечания к образцам
                            </FieldLabel>
                            <Textarea
                                id="occurrence_remarks"
                                className="min-h-18 resize-none"
                                placeholder="Укажите специфические детали экземпляра…"
                                aria-invalid={invalid}
                                {...field}
                                value={field.value?.toString()}
                            />
                            <FieldError errors={[error]} />
                        </Field>
                    )}
                />
            </CardContent>
        </Card>
    );
};

export default QuantitiesCard;
