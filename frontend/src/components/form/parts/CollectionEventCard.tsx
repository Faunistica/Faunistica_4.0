import { type FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, Info } from 'lucide-react';
import SavedPresetSelect from '@/components/form/inputs/SavedPresetSelect';
import type { RecordForm } from '@/types/forms';

interface Props {
    publ_id: number;
    activeRecordId: string | null;
}

const CollectionEventCard: FC<Props> = ({ publ_id, activeRecordId }) => {
    const { control } = useFormContext<RecordForm>();

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="size-8 shrink-0 self-start rounded-lg bg-amber-50 p-2 text-amber-600">
                            <CalendarDays className="size-4" />
                        </span>
                        <CardTitle className="min-w-0 text-lg font-semibold">
                            Параметры сбора материала
                        </CardTitle>
                    </div>
                    <SavedPresetSelect
                        type="event"
                        publ_id={publ_id}
                        activeRecordId={activeRecordId}
                        className="w-full md:w-auto"
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                                            <Info className="size-3.5 cursor-help text-slate-400" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs">
                                            Укажите дату точно так, как она приведена в статье.
                                            Примеры: «19.08.2018», «19.08–02.09.2018», «лето 2017»,
                                            «VIII.2019».
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

                    <Controller
                        name="date_precision"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="date_precision">Точность даты</FieldLabel>
                                <Input
                                    id="date_precision"
                                    placeholder="день, месяц, год…"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString() ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />

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
                </div>

                <div>
                    <Controller
                        name="is_interval"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field orientation="horizontal" data-invalid={invalid}>
                                <Checkbox
                                    id="is_interval"
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                />
                                <FieldLabel
                                    htmlFor="is_interval"
                                    className="cursor-pointer font-normal"
                                >
                                    Дата является интервалом
                                </FieldLabel>
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 lg:grid-cols-3">
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

                    <Controller
                        name="sample_size_value"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="sample_size_value">Объём выборки</FieldLabel>
                                <Input
                                    id="sample_size_value"
                                    type="number"
                                    min={0}
                                    placeholder="Число"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString() ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />

                    <Controller
                        name="sample_size_unit"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="sample_size_unit">Единица выборки</FieldLabel>
                                <Input
                                    id="sample_size_unit"
                                    placeholder="ловушки, взмахи сачком…"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString() ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Controller
                        name="habitat"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <div className="flex items-center gap-1">
                                    <FieldLabel htmlFor="habitat">Биотоп</FieldLabel>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="size-3.5 cursor-help text-slate-400" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs">
                                            Если биотопов несколько, разделяйте их точкой с запятой
                                            «;».
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id="habitat"
                                    className="min-h-8 resize-none"
                                    placeholder="Описание местообитания; второе местообитание"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString() ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />

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
                                    value={field.value ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <Controller
                        name="event_remarks"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="event_remarks">
                                    Примечания к событию
                                </FieldLabel>
                                <Textarea
                                    id="event_remarks"
                                    className="min-h-20 resize-none"
                                    placeholder="Погодные условия, методика и т.п."
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString() ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

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
                                    value={field.value?.toString() ?? ''}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="catalog_number"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="catalog_number">Каталожный номер</FieldLabel>
                                <Input
                                    id="catalog_number"
                                    placeholder="Каталожный №"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString() ?? ''}
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
                                    value={field.value?.toString() ?? ''}
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
