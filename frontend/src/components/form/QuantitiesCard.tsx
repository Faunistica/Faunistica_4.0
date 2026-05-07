import { type FC } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hash } from 'lucide-react';
import { QUANTITY_FIELD_LABELS, QUANTITY_TYPE_OPTIONS } from '@/types/forms';
import type { FormSchema } from '@/types/forms';

interface Props {
    index: number;
}

const QuantitiesCard: FC<Props> = ({ index }) => {
    const { register, control } = useFormContext<FormSchema>();
    const prefix = `samples.${index}` as const;

    // Watch all quantity fields to compute total
    const mmm = useWatch<FormSchema>({ name: `${prefix}.mmm` as any }) as number | null | undefined;
    const ssm = useWatch<FormSchema>({ name: `${prefix}.ssm` as any }) as number | null | undefined;
    const fff = useWatch<FormSchema>({ name: `${prefix}.fff` as any }) as number | null | undefined;
    const ssf = useWatch<FormSchema>({ name: `${prefix}.ssf` as any }) as number | null | undefined;
    const adu = useWatch<FormSchema>({ name: `${prefix}.adu` as any }) as number | null | undefined;
    const juv = useWatch<FormSchema>({ name: `${prefix}.juv` as any }) as number | null | undefined;

    const total: number = [mmm, ssm, fff, ssf, adu, juv]
        .reduce<number>((sum, v) => sum + (typeof v === 'number' && v > 0 ? v : 0), 0);

    const quantityFields = [
        { key: 'mmm' as const, label: QUANTITY_FIELD_LABELS.mmm, color: 'text-blue-600' },
        { key: 'ssm' as const, label: QUANTITY_FIELD_LABELS.ssm, color: 'text-blue-400' },
        { key: 'fff' as const, label: QUANTITY_FIELD_LABELS.fff, color: 'text-pink-600' },
        { key: 'ssf' as const, label: QUANTITY_FIELD_LABELS.ssf, color: 'text-pink-400' },
        { key: 'adu' as const, label: QUANTITY_FIELD_LABELS.adu, color: 'text-slate-600' },
        { key: 'juv' as const, label: QUANTITY_FIELD_LABELS.juv, color: 'text-amber-600' },
    ];

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Hash className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Количественные характеристики</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* ── Quantity fields grid ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quantityFields.map(({ key, label, color }) => (
                        <div key={key} className="space-y-1.5">
                            <Label htmlFor={`${prefix}.${key}`} className={`text-xs font-medium ${color}`}>
                                {label}
                            </Label>
                            <Input
                                id={`${prefix}.${key}`}
                                type="number"
                                min={0}
                                placeholder="0"
                                className="text-center"
                                {...register(`${prefix}.${key}` as any, { valueAsNumber: true })}
                            />
                        </div>
                    ))}
                </div>

                {/* ── Unit type + Total ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                    <div className="space-y-2">
                        <Label>Единицы измерения</Label>
                        <Controller
                            name={`${prefix}.quantity_type` as any}
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value ?? 'особей'} onValueChange={field.onChange}>
                                    <SelectTrigger><SelectValue placeholder="Выберите единицы" /></SelectTrigger>
                                    <SelectContent>
                                        {QUANTITY_TYPE_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Общее количество (вычислено)</Label>
                        <div className="flex items-center h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                            {total > 0 ? total : '—'}
                        </div>
                    </div>
                </div>

                {/* ── Occurrence remarks ── */}
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}.occurrence_remarks`}>Примечания к образцам</Label>
                    <Textarea
                        id={`${prefix}.occurrence_remarks`}
                        className="min-h-[72px] resize-none"
                        placeholder="Укажите специфические детали экземпляра…"
                        {...register(`${prefix}.occurrence_remarks` as any)}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default QuantitiesCard;
