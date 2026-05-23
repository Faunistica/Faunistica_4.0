import { type FC, useState } from 'react';
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
import { FormAutocomplete } from '@/components/form/FormAutocomplete';
import { FormTextField } from '@/components/form/FormTextField';
import { Bug } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useLazySuggestTaxonQuery } from '@/api/utilAPI';
import { TYPE_STATUS_OPTIONS, TAXON_RANK_OPTIONS } from '@/types/forms';
import type { FormRecord } from '@/types/api.dto';

const TaxonomyCard: FC = () => {
    const { control, watch, setValue } = useFormContext<FormRecord>();

    const familyValue = watch('family');
    const genusValue = watch('genus');

    const [searchFamily] = useLazySuggestTaxonQuery();
    const [searchGenus] = useLazySuggestTaxonQuery();
    const [searchSpecies] = useLazySuggestTaxonQuery();

    const [familySuggestions, setFamilySuggestions] = useState<string[]>([]);
    const [genusSuggestions, setGenusSuggestions] = useState<string[]>([]);
    const [speciesSuggestions, setSpeciesSuggestions] = useState<string[]>([]);
    const [famLoading, setFamLoading] = useState(false);
    const [genLoading, setGenLoading] = useState(false);
    const [spLoading, setSpLoading] = useState(false);

    const handleFamilySearch = useDebouncedCallback(async (text: string) => {
        setFamLoading(true);
        try {
            const r = await searchFamily({ field: 'family', text }).unwrap();
            setFamilySuggestions(r.suggestions ?? []);
        } finally {
            setFamLoading(false);
        }
    }, 300);

    const handleGenusSearch = useDebouncedCallback(async (text: string) => {
        setGenLoading(true);
        try {
            const r = await searchGenus({
                field: 'genus',
                text,
                family: familyValue,
            }).unwrap();
            setGenusSuggestions(r.suggestions ?? []);
        } finally {
            setGenLoading(false);
        }
    }, 300);

    const handleSpeciesSearch = useDebouncedCallback(async (text: string) => {
        setSpLoading(true);
        try {
            const r = await searchSpecies({
                field: 'species',
                text,
                family: familyValue,
                genus: genusValue,
            }).unwrap();
            setSpeciesSuggestions(r.suggestions ?? []);
        } finally {
            setSpLoading(false);
        }
    }, 300);

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
                        label="Семейство (Familia)"
                        onSearch={handleFamilySearch}
                        suggestions={familySuggestions}
                        isLoading={famLoading}
                        placeholder="Начните вводить…"
                        onChangeExtra={handleAutocompleteChange}
                    />
                    <FormAutocomplete
                        name="genus"
                        label="Род (Genus)"
                        onSearch={handleGenusSearch}
                        suggestions={genusSuggestions}
                        isLoading={genLoading}
                        placeholder="Название рода"
                        onChangeExtra={handleAutocompleteChange}
                    />
                    <FormAutocomplete
                        name="species"
                        label="Видовое название (эпитет)"
                        onSearch={handleSpeciesSearch}
                        suggestions={speciesSuggestions}
                        isLoading={spLoading}
                        placeholder="Только эпитет, без рода"
                        onChangeExtra={handleAutocompleteChange}
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
