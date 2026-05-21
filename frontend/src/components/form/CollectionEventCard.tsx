import { type FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CalendarDays, Info } from 'lucide-react';
import type { FormRecord } from '@/types/api.dto';

interface Props {
    publ_id: number;
}

const CollectionEventCard: FC<Props> = () => {
    const {
        register,
        formState: { errors },
    } = useFormContext<FormRecord>();

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <TooltipProvider>
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label htmlFor="verbatim_date">Дата сбора (как в статье)</Label>
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
                                id="verbatim_date"
                                placeholder="19.08-02.09.2018"
                                aria-invalid={!!errors?.verbatim_date}
                                {...register('verbatim_date')}
                            />
                        </div>
                    </TooltipProvider>

                    <div className="space-y-2">
                        <Label htmlFor="recorded_by">Коллектор</Label>
                        <Input
                            id="recorded_by"
                            placeholder="Фамилия И.О."
                            aria-invalid={!!errors?.recorded_by}
                            {...register('recorded_by')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sampling_protocol">Метод сбора</Label>
                        <Input
                            id="sampling_protocol"
                            placeholder="ловушки Барбера, кошение сачком…"
                            aria-invalid={!!errors?.sampling_protocol}
                            {...register('sampling_protocol')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TooltipProvider>
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label htmlFor="habitat">Биотоп</Label>
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
                                id="habitat"
                                className="min-h-[32px] resize-none"
                                placeholder="Описание местообитания; второе местообитание"
                                {...register('habitat')}
                            />
                        </div>
                    </TooltipProvider>

                    <div className="space-y-2">
                        <Label htmlFor="sampling_effort">Выборочное усилие</Label>
                        <Input
                            id="sampling_effort"
                            placeholder="Например: 20 ловушко-суток"
                            {...register('sampling_effort')}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="event_remarks">Примечания к событию</Label>
                    <Textarea
                        id="event_remarks"
                        className="min-h-[80px] resize-none"
                        placeholder="Погодные условия, методика и т.п."
                        {...register('event_remarks')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                    <div className="space-y-2">
                        <Label htmlFor="field_number">Полевой номер</Label>
                        <Input
                            id="field_number"
                            placeholder="Полевой №"
                            {...register('field_number')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="catalog_number">Каталожный номер</Label>
                        <Input
                            id="catalog_number"
                            placeholder="Каталожный №"
                            {...register('catalog_number')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="collection_code">Коллекционный код</Label>
                        <Input
                            id="collection_code"
                            placeholder="Код коллекции"
                            {...register('collection_code')}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CollectionEventCard;
