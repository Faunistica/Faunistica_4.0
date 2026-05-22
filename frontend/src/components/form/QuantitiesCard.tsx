import { type FC } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
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
import { Hash } from 'lucide-react';
import { QUANTITY_FIELD_LABELS, QUANTITY_TYPE_OPTIONS } from '@/types/forms';
import type { FormRecord } from '@/types/api.dto';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const QuantitiesCard: FC = () => {
    const { register, control } = useFormContext<FormRecord>();

    const males = useWatch<FormRecord>({ name: 'males' });
    const subadultMales = useWatch<FormRecord>({ name: 'subadultMales' });
    const females = useWatch<FormRecord>({ name: 'females' });
    const subadultFemales = useWatch<FormRecord>({ name: 'subadultFemales' });
    const adults = useWatch<FormRecord>({ name: 'adults' });
    const juveniles = useWatch<FormRecord>({ name: 'juveniles' });

    const total: number = [
        males,
        subadultMales,
        females,
        subadultFemales,
        adults,
        juveniles,
    ].reduce<number>((sum, v) => sum + (typeof v === 'number' && v > 0 ? v : 0), 0);

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
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Hash className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                        Количественные характеристики
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <TooltipProvider>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {quantityFields.map(({ key, label, color }) => (
                            <div key={key} className="min-w-0 space-y-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label
                                            htmlFor={key}
                                            className={cn('text-[10px] font-semibold tracking-wider uppercase', color, 'block cursor-help truncate')}
                                        >
                                            {label}
                                        </Label>
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
                                    {...register(key, {
                                        valueAsNumber: true,
                                    })}
                                />
                            </div>
                        ))}
                    </div>
                </TooltipProvider>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Единицы измерения</Label>
                        <Controller
                            name="quantity_type"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger>
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
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Общее количество (вычислено)</Label>
                        <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                            {total > 0 ? total : '—'}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="occurrence_remarks">Примечания к образцам</Label>
                    <Textarea
                        id="occurrence_remarks"
                        className="min-h-18 resize-none"
                        placeholder="Укажите специфические детали экземпляра…"
                        {...register('occurrence_remarks')}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default QuantitiesCard;
