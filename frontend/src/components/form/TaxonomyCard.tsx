import { type FC } from 'react';
import { useFormContext, Controller, useFormState, useWatch } from 'react-hook-form';
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
import { FormAutocomplete } from '@/components/form/FormAutocomplete';
import { FormTextField } from '@/components/form/FormTextField';
import { Bug } from 'lucide-react';
import { useLazySuggestTaxonQuery } from '@/api/utilAPI';
import { TYPE_STATUS_OPTIONS, TAXON_RANK_OPTIONS } from '@/types/forms';
import type { FormRecord } from '@/types/api.dto';

const TaxonomyCard: FC = () => {
    const { control, setValue } = useFormContext<FormRecord>();

    const [searchFamily, { isLoading: familyLoading }] = useLazySuggestTaxonQuery();
    const [searchGenus, { isLoading: genusLoading }] = useLazySuggestTaxonQuery();
    const [searchSpecies, { isLoading: speciesLoading }] = useLazySuggestTaxonQuery();

    // TODO: idk how to do useWatch safely
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const [family, genus] = useWatch<FormRecord>({
        control,
        name: ['family', 'genus'],
    }) as (string | null | undefined)[];
    const { errors } = useFormState({ control, name: ['family', 'genus', 'species'] });

    const familySearchFn = (text: string) =>
        searchFamily({ field: 'family', text })
            .unwrap()
            .then((r) => r.suggestions ?? []);

    const genusSearchFn = (text: string) => {
        const extra: {
            family?: string | null;
        } = {};

        if (!errors.family) {
            extra.family = family;
        }

        return searchGenus({ field: 'genus', text, ...extra })
            .unwrap()
            .then((r) => r.suggestions ?? []);
    };

    const speciesSearchFn = (text: string) => {
        const extra: {
            family?: string | null;
            genus?: string | null;
        } = {};

        if (!errors.family) {
            extra.family = family;
        }
        if (!errors.genus) {
            extra.genus = genus;
        }

        return searchGenus({ field: 'species', text, ...extra })
            .unwrap()
            .then((r) => r.suggestions ?? []);
    };

    const handleAutocompleteChange = () => {
        setValue('tax_verbatim', false);
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <Bug className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                        Таксономическая принадлежность
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormAutocomplete
                        name="family"
                        isLoading={familyLoading}
                        label="Семейство (Familia)"
                        searchFn={familySearchFn}
                        placeholder="Начните вводить…"
                        onSelectExtra={handleAutocompleteChange}
                    />
                    <FormAutocomplete
                        name="genus"
                        isLoading={genusLoading}
                        label="Род (Genus)"
                        searchFn={genusSearchFn}
                        placeholder="Название рода"
                        onSelectExtra={handleAutocompleteChange}
                    />
                    <FormAutocomplete
                        name="species"
                        isLoading={speciesLoading}
                        label="Видовое название (эпитет)"
                        searchFn={speciesSearchFn}
                        placeholder="Только эпитет, без рода"
                        onSelectExtra={handleAutocompleteChange}
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
                    <FormTextField
                        name="accepted_name"
                        label="Валидное название"
                        placeholder="Если приведённое в статье устарело"
                    />
                </div>

                <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-4">
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

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <FormTextField
                        name="taxon_remarks"
                        label="Таксономические примечания"
                        placeholder="Примечания ко всему таксону…"
                        inputType="textarea"
                    />
                    <FormTextField
                        name="identification_remarks"
                        label="Примечания к идентификации"
                        placeholder="Примечания к определению…"
                        inputType="textarea"
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default TaxonomyCard;
