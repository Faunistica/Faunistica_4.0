import { type FC } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { FormAutocomplete } from '@/components/form/inputs/FormAutocomplete';
import { Hash } from 'lucide-react';
import { QUANTITY_FIELD_LABELS, QUANTITY_TYPE_OPTIONS } from '@/lib/constants';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RecordForm } from '@/types/forms';

const QuantitiesCard: FC = () => {
    const { control } = useFormContext<RecordForm>();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const total = useWatch<RecordForm>({
        name: ['males', 'subadultMales', 'females', 'subadultFemales', 'adults', 'juveniles'],
        compute: (data) =>
            data.reduce<number>((sum, v) => {
                // Handle both numbers and strings from form inputs
                // v should never be a boolean, it's a RHF thing
                if (typeof v === 'boolean') {
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
        { key: 'adults' as const, label: QUANTITY_FIELD_LABELS.adults, color: 'text-muted-foreground' },
        {
            key: 'juveniles' as const,
            label: QUANTITY_FIELD_LABELS.juveniles,
            color: 'text-amber-600',
        },
    ];

    return (
        <Card className="border-border shadow-sm">
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

                <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 md:grid-cols-2">
                    <FormAutocomplete
                        name="quantity_type"
                        label="Единицы измерения"
                        placeholder="Выберите единицы"
                        options={QUANTITY_TYPE_OPTIONS.map((o) => o.label)}
                    />
                    <Field>
                        <FieldLabel>Общее количество (вычислено)</FieldLabel>
                        <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm font-semibold text-foreground">
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
                                className="max-h-fit min-h-18"
                                placeholder="Укажите специфические детали экземпляра…"
                                aria-invalid={invalid}
                                {...field}
                                value={field.value?.toString() ?? ''}
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
