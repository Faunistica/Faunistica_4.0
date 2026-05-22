import { type FC } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import SavedPresetSelect from './SavedPresetSelect';
import { CalendarDays, Info } from 'lucide-react';
import type { FormSchema } from '@/types/forms';

interface Props {
    index: number;
    publ_id: number;
}

const CollectionEventCard: FC<Props> = ({ index }) => {
    const { register } = useFormContext<FormSchema>();
    const prefix = `samples.${index}` as const;
    const { errors } = useFormState({ name: prefix });
    const err = errors.samples?.[index];

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <CalendarDays className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                        Параметры сбора материала
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* ── Saved preset ── */}
                <SavedPresetSelect type="event" currentIndex={index} />

                {/* ── Row 1: Date + Collector + Method ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <TooltipProvider>
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label htmlFor={`${prefix}.verbatim_date`}>
                                    Дата сбора (как в статье)
                                </Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs">
                                        Укажите дату точно так, как она приведена в статье. Примеры:
                                        «19.08.2018», «19.08–02.09.2018», «лето 2017», «VIII.2019».
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                id={`${prefix}.verbatim_date`}
                                placeholder="19.08-02.09.2018"
                                aria-invalid={!!err?.verbatim_date}
                                {...register(`${prefix}.verbatim_date`, { required: 'Обязательное поле' })}
                            />
                        </div>
                    </TooltipProvider>

                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.recorded_by`}>Коллектор</Label>
                        <Input
                            id={`${prefix}.recorded_by`}
                            placeholder="Фамилия И.О."
                            aria-invalid={!!err?.recorded_by}
                            {...register(`${prefix}.recorded_by`, { required: 'Обязательное поле' })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.sampling_protocol`}>Метод сбора</Label>
                        <Input
                            id={`${prefix}.sampling_protocol`}
                            placeholder="ловушки Барбера, кошение сачком…"
                            {...register(`${prefix}.sampling_protocol`)}
                        />
                    </div>
                </div>

                {/* ── Row 2: Habitat + Effort ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TooltipProvider>
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label htmlFor={`${prefix}.habitat`}>Биотоп</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs">
                                        Если биотопов несколько, разделяйте их точкой с запятой «;».
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                id={`${prefix}.habitat`}
                                className="min-h-[32px] resize-none"
                                placeholder="Описание местообитания; второе местообитание"
                                {...register(`${prefix}.habitat`)}
                            />
                        </div>
                    </TooltipProvider>

                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.sampling_effort`}>Выборочное усилие</Label>
                        <Input
                            id={`${prefix}.sampling_effort`}
                            placeholder="Например: 20 ловушко-суток"
                            {...register(`${prefix}.sampling_effort`)}
                        />
                    </div>
                </div>

                {/* ── Row 3: Remarks ── */}
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}.event_remarks`}>Примечания к событию</Label>
                    <Textarea
                        id={`${prefix}.event_remarks`}
                        className="min-h-[80px] resize-none"
                        placeholder="Погодные условия, методика и т.п."
                        {...register(`${prefix}.event_remarks`)}
                    />
                </div>

                {/* ── Row 4: Collection identifiers ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.field_number`}>Полевой номер</Label>
                        <Input
                            id={`${prefix}.field_number`}
                            placeholder="Полевой №"
                            {...register(`${prefix}.field_number`)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.catalog_number`}>Каталожный номер</Label>
                        <Input
                            id={`${prefix}.catalog_number`}
                            placeholder="Каталожный №"
                            {...register(`${prefix}.catalog_number`)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.collection_code`}>Коллекционный код</Label>
                        <Input
                            id={`${prefix}.collection_code`}
                            placeholder="Код коллекции"
                            {...register(`${prefix}.collection_code`)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CollectionEventCard;
