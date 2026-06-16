import { type FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SavedPresetSelect from '@/components/form/inputs/SavedPresetSelect';
import { FormAutocomplete } from '@/components/form/inputs/FormAutocomplete';
import type { RecordForm } from '@/types/forms';

interface Props {
    publ_id: number;
    activeRecordId: string | null;
}

const CollectionEventCard: FC<Props> = ({ publ_id, activeRecordId }) => {
    const { t } = useTranslation();
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
                            {t('form.collectionParameters')}
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
                                        {t('form.collection.collectionDate')}
                                    </FieldLabel>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="size-3.5 cursor-help text-slate-400" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs">
                                            {t('form.collection.collectionDateTooltip')}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id="verbatim_date"
                                    placeholder={t('form.collection.collectionDatePlaceholder')}
                                    aria-invalid={invalid}
                                    {...field}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />

                    <FormAutocomplete
                        name="date_precision"
                        label={t('form.collection.datePrecision')}
                        placeholder={t('form.collection.datePrecisionPlaceholder')}
                        options={['день', 'неделя', 'месяц', 'год'].map((d) => ({
                            value: d,
                            label: t(`form.collection.datePrecisionOptions.${d}`),
                        }))}
                    />

                    <Controller
                        name="recorded_by"
                        control={control}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="recorded_by">
                                    {t('form.collection.collector')}
                                </FieldLabel>
                                <Input
                                    id="recorded_by"
                                    placeholder={t('form.collection.collectorPlaceholder')}
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
                                    {t('form.collection.dateIsInterval')}
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
                                <FieldLabel htmlFor="sampling_protocol">
                                    {t('form.collection.collectionMethod')}
                                </FieldLabel>
                                <Input
                                    id="sampling_protocol"
                                    placeholder={t('form.collection.collectionMethodPlaceholder')}
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
                                <FieldLabel htmlFor="sample_size_value">
                                    {t('form.collection.sampleSize')}
                                </FieldLabel>
                                <Input
                                    id="sample_size_value"
                                    type="number"
                                    min={0}
                                    placeholder={t('form.collection.sampleSizePlaceholder')}
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
                                <FieldLabel htmlFor="sample_size_unit">
                                    {t('form.collection.sampleUnit')}
                                </FieldLabel>
                                <Input
                                    id="sample_size_unit"
                                    placeholder={t('form.collection.sampleUnitPlaceholder')}
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
                                    <FieldLabel htmlFor="habitat">
                                        {t('form.collection.habitat')}
                                    </FieldLabel>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="size-3.5 cursor-help text-slate-400" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs">
                                            {t('form.collection.habitatTooltip')}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id="habitat"
                                    className="min-h-8 resize-none"
                                    placeholder={t('form.collection.habitatPlaceholder')}
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
                                <FieldLabel htmlFor="sampling_effort">
                                    {t('form.collection.samplingEffort')}
                                </FieldLabel>
                                <Input
                                    id="sampling_effort"
                                    placeholder={t('form.collection.samplingEffortPlaceholder')}
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
                                    {t('form.collection.eventNotes')}
                                </FieldLabel>
                                <Textarea
                                    id="event_remarks"
                                    className="max-h-fit min-h-20"
                                    placeholder={t('form.collection.eventNotesPlaceholder')}
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
                                <FieldLabel htmlFor="field_number">
                                    {t('form.collection.fieldNumber')}
                                </FieldLabel>
                                <Input
                                    id="field_number"
                                    placeholder={t('form.collection.fieldNumberPlaceholder')}
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
                                <FieldLabel htmlFor="catalog_number">
                                    {t('form.collection.catalogNumber')}
                                </FieldLabel>
                                <Input
                                    id="catalog_number"
                                    placeholder={t('form.collection.catalogNumberPlaceholder')}
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
                                <FieldLabel htmlFor="collection_code">
                                    {t('form.collection.collectionCode')}
                                </FieldLabel>
                                <Input
                                    id="collection_code"
                                    placeholder={t('form.collection.collectionCodePlaceholder')}
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
