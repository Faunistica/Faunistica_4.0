import { type FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CalendarDays, Info } from 'lucide-react';
import type { FormRecord, RecordFull } from '@/types/api.dto';
import SavedPresetSelect from '@/components/form/SavedPresetSelect';

interface Props {
    publ_id: number;
    otherRecords: RecordFull[];
}

const CollectionEventCard: FC<Props> = ({ otherRecords }) => {
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
                <SavedPresetSelect type="event" otherRecords={otherRecords} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <TooltipProvider>
                        <Field data-invalid={!!errors?.verbatim_date}>
                            <div className="flex items-center gap-1">
                                <FieldLabel htmlFor="verbatim_date">
                                    Дата сбора (как в статье)
                                </FieldLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 cursor-help text-slate-400" />
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
                            <FieldError errors={[errors?.verbatim_date]} />
                        </Field>
                    </TooltipProvider>

                    <Field data-invalid={!!errors?.recorded_by}>
                        <FieldLabel htmlFor="recorded_by">Коллектор</FieldLabel>
                        <Input
                            id="recorded_by"
                            placeholder="Фамилия И.О."
                            aria-invalid={!!errors?.recorded_by}
                            {...register('recorded_by')}
                        />
                        <FieldError errors={[errors?.recorded_by]} />
                    </Field>

                    <Field data-invalid={!!errors?.sampling_protocol}>
                        <FieldLabel htmlFor="sampling_protocol">Метод сбора</FieldLabel>
                        <Input
                            id="sampling_protocol"
                            placeholder="ловушки Барбера, кошение сачком…"
                            aria-invalid={!!errors?.sampling_protocol}
                            {...register('sampling_protocol')}
                        />
                        <FieldError errors={[errors?.sampling_protocol]} />
                    </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <TooltipProvider>
                        <Field data-invalid={!!errors?.habitat}>
                            <div className="flex items-center gap-1">
                                <FieldLabel htmlFor="habitat">Биотоп</FieldLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 cursor-help text-slate-400" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs">
                                        Если биотопов несколько, разделяйте их точкой с запятой «;».
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                id="habitat"
                                className="min-h-8 resize-none"
                                placeholder="Описание местообитания; второе местообитание"
                                {...register('habitat')}
                            />
                            <FieldError errors={[errors?.habitat]} />
                        </Field>
                    </TooltipProvider>

                    <Field data-invalid={!!errors?.sampling_effort}>
                        <FieldLabel htmlFor="sampling_effort">Выборочное усилие</FieldLabel>
                        <Input
                            id="sampling_effort"
                            placeholder="Например: 20 ловушко-суток"
                            {...register('sampling_effort')}
                        />
                        <FieldError errors={[errors?.sampling_effort]} />
                    </Field>
                </div>

                <Field data-invalid={!!errors?.event_remarks}>
                    <FieldLabel htmlFor="event_remarks">Примечания к событию</FieldLabel>
                    <Textarea
                        id="event_remarks"
                        className="min-h-20 resize-none"
                        placeholder="Погодные условия, методика и т.п."
                        {...register('event_remarks')}
                    />
                    <FieldError errors={[errors?.event_remarks]} />
                </Field>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
                    <Field data-invalid={!!errors?.field_number}>
                        <FieldLabel htmlFor="field_number">Полевой номер</FieldLabel>
                        <Input
                            id="field_number"
                            placeholder="Полевой №"
                            {...register('field_number')}
                        />
                        <FieldError errors={[errors?.field_number]} />
                    </Field>
                    <Field data-invalid={!!errors?.catalog_number}>
                        <FieldLabel htmlFor="catalog_number">Каталожный номер</FieldLabel>
                        <Input
                            id="catalog_number"
                            placeholder="Каталожный №"
                            {...register('catalog_number')}
                        />
                        <FieldError errors={[errors?.catalog_number]} />
                    </Field>
                    <Field data-invalid={!!errors?.collection_code}>
                        <FieldLabel htmlFor="collection_code">Коллекционный код</FieldLabel>
                        <Input
                            id="collection_code"
                            placeholder="Код коллекции"
                            {...register('collection_code')}
                        />
                        <FieldError errors={[errors?.collection_code]} />
                    </Field>
                </div>
            </CardContent>
        </Card>
    );
};

export default CollectionEventCard;
