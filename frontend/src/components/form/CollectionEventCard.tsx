import { type FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CalendarDays, Info } from 'lucide-react';
import type { FormRecord } from '@/types/api.dto';
import SavedPresetSelect from '@/components/form/SavedPresetSelect';

interface Props {
    publ_id: number;
    activeRecordId: string | null;
}

const CollectionEventCard: FC<Props> = ({ publ_id, activeRecordId }) => {
    const { control } = useFormContext<FormRecord>();

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex justify-between pb-2">
                <div className="flex items-center gap-2">
                    <span className="size-8 rounded-lg bg-amber-50 p-2 text-amber-600">
                        <CalendarDays className="size-4 " />
                    </span>
                    <CardTitle className="text-lg font-semibold">
                        Параметры сбора материала
                    </CardTitle>
                </div>
                <SavedPresetSelect type="event" publ_id={publ_id} activeRecordId={activeRecordId} />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <TooltipProvider>
                        <Controller
                            name="verbatim_date"
                            control={control}
                            render={({ field, fieldState: { error, invalid } }) => (
                                <Field data-invalid={invalid}>
                                    <div className="flex items-center gap-1">
                                        <FieldLabel htmlFor="verbatim_date">
                                            Дата сбора (как в статье)
                                        </FieldLabel>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="size-3.5  cursor-help text-slate-400" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs text-xs">
                                                Укажите дату точно так, как она приведена в статье.
                                                Примеры: «19.08.2018», «19.08–02.09.2018», «лето
                                                2017», «VIII.2019».
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="verbatim_date"
                                        placeholder="19.08-02.09.2018"
                                        aria-invalid={invalid}
                                        {...field}
                                    />
                                    <FieldError errors={[error]} />
                                </Field>
                            )}
                        />
                    </TooltipProvider>

                    <Controller
                        name="recorded_by"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="recorded_by">Коллектор</FieldLabel>
                                <Input
                                    id="recorded_by"
                                    placeholder="Фамилия И.О."
                                    aria-invalid={invalid}
                                    {...field}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />

                    <Controller
                        name="sampling_protocol"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="sampling_protocol">Метод сбора</FieldLabel>
                                <Input
                                    id="sampling_protocol"
                                    placeholder="ловушки Барбера, кошение сачком…"
                                    aria-invalid={invalid}
                                    {...field}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <TooltipProvider>
                        <Controller
                            name="habitat"
                            control={control}
                            render={({ field, fieldState: { error, invalid } }) => (
                                <Field data-invalid={invalid}>
                                    <div className="flex items-center gap-1">
                                        <FieldLabel htmlFor="habitat">Биотоп</FieldLabel>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="size-3.5  cursor-help text-slate-400" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs text-xs">
                                                Если биотопов несколько, разделяйте их точкой с
                                                запятой «;».
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="habitat"
                                        className="min-h-8 resize-none"
                                        placeholder="Описание местообитания; второе местообитание"
                                        aria-invalid={invalid}
                                        {...field}
                                        value={field.value?.toString()}
                                    />
                                    <FieldError errors={[error]} />
                                </Field>
                            )}
                        />
                    </TooltipProvider>

                    <Controller
                        name="sampling_effort"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="sampling_effort">Выборочное усилие</FieldLabel>
                                <Input
                                    id="sampling_effort"
                                    placeholder="Например: 20 ловушко-суток"
                                    aria-invalid={invalid}
                                    {...field}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                <Controller
                    name="event_remarks"
                    control={control}
                    render={({ field, fieldState: { error, invalid } }) => (
                        <Field data-invalid={invalid}>
                            <FieldLabel htmlFor="event_remarks">Примечания к событию</FieldLabel>
                            <Textarea
                                id="event_remarks"
                                className="min-h-20 resize-none"
                                placeholder="Погодные условия, методика и т.п."
                                aria-invalid={invalid}
                                {...field}
                                value={field.value?.toString()}
                            />
                            <FieldError errors={[error]} />
                        </Field>
                    )}
                />

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
                    <Controller
                        name="field_number"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="field_number">Полевой номер</FieldLabel>
                                <Input
                                    id="field_number"
                                    placeholder="Полевой №"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString()}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="catalog_number"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={error}>
                                <FieldLabel htmlFor="catalog_number">Каталожный номер</FieldLabel>
                                <Input
                                    id="catalog_number"
                                    placeholder="Каталожный №"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString()}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="collection_code"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="collection_code">Коллекционный код</FieldLabel>
                                <Input
                                    id="collection_code"
                                    placeholder="Код коллекции"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString()}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default CollectionEventCard;
