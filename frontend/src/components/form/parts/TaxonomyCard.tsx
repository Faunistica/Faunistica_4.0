import { type FC } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { FormAutocomplete } from '@/components/form/inputs/FormAutocomplete';
import { Bug } from 'lucide-react';
import { useLazySuggestTaxonQuery } from '@/api/utilAPI';
import { TYPE_STATUS_OPTIONS, TAXON_RANK_OPTIONS } from '@/types/constants';
import type { FormRecord } from '@/types/api.dto';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

const TaxonomyCard: FC = () => {
    const { control, setValue, getValues, getFieldState } = useFormContext<FormRecord>();

    const [suggestTaxon] = useLazySuggestTaxonQuery();

    const familySearchFn = (query: string) =>
        suggestTaxon({ field: 'family', query })
            .unwrap()
            .then((r) => r.suggestions ?? []);

    const genusSearchFn = (query: string) => {
        const extra: {
            family?: string | null;
        } = {};

        const family = getValues('family');
        const familyState = getFieldState('family');

        if (!familyState.error) {
            extra.family = family;
        }

        return suggestTaxon({ field: 'genus', query, ...extra })
            .unwrap()
            .then((r) => r.suggestions ?? []);
    };

    const speciesSearchFn = (query: string) => {
        const extra: {
            family?: string | null;
            genus?: string | null;
        } = {};

        const family = getValues('family');
        const familyState = getFieldState('family');

        if (!familyState.error) {
            extra.family = family;
        }

        const genus = getValues('genus');
        const genusState = getFieldState('genus');

        if (!genusState.error) {
            extra.genus = genus;
        }

        return suggestTaxon({ field: 'species', query, ...extra })
            .unwrap()
            .then((r) => r.suggestions ?? []);
    };

    const handleTaxonSuggestionSelect = () => {
        setValue('tax_verbatim', false);
    };

    const handleTaxonTypedCommit = () => {
        setValue('tax_verbatim', true);
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="md:pb-4">
                <div className="flex gap-2 md:items-center">
                    <span className="size-8 rounded-lg bg-violet-50 p-2 text-violet-600">
                        <Bug className="size-4" />
                    </span>
                    <CardTitle className="pt-0.5 text-lg font-semibold md:pt-0">
                        Таксономическая принадлежность
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormAutocomplete
                        name="family"
                        label="Семейство (Familia)"
                        searchFn={familySearchFn}
                        placeholder="Начните вводить…"
                        onSelectSuggestion={handleTaxonSuggestionSelect}
                        onCommitTyped={handleTaxonTypedCommit}
                    />
                    <FormAutocomplete
                        name="genus"
                        label="Род (Genus)"
                        searchFn={genusSearchFn}
                        placeholder="Название рода"
                        onSelectSuggestion={handleTaxonSuggestionSelect}
                        onCommitTyped={handleTaxonTypedCommit}
                    />
                    <FormAutocomplete
                        name="species"
                        label="Видовое название (эпитет)"
                        searchFn={speciesSearchFn}
                        placeholder="Только эпитет, без рода"
                        onSelectSuggestion={handleTaxonSuggestionSelect}
                        onCommitTyped={handleTaxonTypedCommit}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
                    <Controller
                        name="taxon_rank"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Ранг таксона</FieldLabel>
                                <Select
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Выберите ранг" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TAXON_RANK_OPTIONS.map((opt) => (
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
                    <Controller
                        name="type_status"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Типовой статус</FieldLabel>
                                <Select
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Выберите статус" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TYPE_STATUS_OPTIONS.map((opt) => (
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
                    <Controller
                        name="accepted_name"
                        control={control}
                        render={({ field, fieldState: { invalid, error } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="accepted_name">Валидное название</FieldLabel>
                                <Input
                                    id="accepted_name"
                                    placeholder="Если приведённое в статье устарело"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString()}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                </div>

                <div className="flex flex-wrap gap-6">
                    <Controller
                        name="tax_verbatim"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                                <Checkbox
                                    id="tax_verbatim"
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                />
                                <FieldLabel
                                    htmlFor="tax_verbatim"
                                    className="cursor-pointer font-normal"
                                >
                                    Латинское название введено вручную
                                </FieldLabel>
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
                    <Controller
                        name="taxon_remarks"
                        control={control}
                        render={({ field, fieldState: { invalid, error } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="taxon_remarks">
                                    Таксономические примечания
                                </FieldLabel>
                                <Textarea
                                    id="taxon_remarks"
                                    placeholder="Примечания ко всему таксону…"
                                    aria-invalid={invalid}
                                    {...field}
                                    value={field.value?.toString()}
                                />
                                <FieldError errors={[error]} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="identification_remarks"
                        control={control}
                        render={({ field, fieldState: { invalid, error } }) => (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor="identification_remarks">
                                    Примечания к идентификации
                                </FieldLabel>
                                <Textarea
                                    id="identification_remarks"
                                    placeholder="Примечания к определению…"
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

export default TaxonomyCard;
