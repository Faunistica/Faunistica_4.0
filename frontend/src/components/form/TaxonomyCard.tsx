import { type FC, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Autocomplete from '@/components/ui/autocomplete';
import { Bug } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useLazySuggestTaxonQuery } from '@/api/utilAPI';
import { TYPE_STATUS_OPTIONS, TAXON_RANK_OPTIONS } from '@/types/forms';
import type { FormSchema } from '@/types/forms';

interface Props {
    index: number;
}

const FamilyAutocomplete: FC<{ prefix: string }> = ({ prefix }) => {
    const { control, setValue } = useFormContext<FormSchema>();
    const [searchFamily] = useLazySuggestTaxonQuery();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = useDebouncedCallback(async (text: string) => {
        setIsLoading(true);
        try {
            const r = await searchFamily({ field: 'family', text }).unwrap();
            setSuggestions(r.suggestions ?? []);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    return (
        <Controller
            name={`${prefix}.family`}
            control={control}
            rules={{ 
                required: 'Обязательное поле',
                pattern: { value: /^[^А-Яа-яЁё]+$/, message: 'Кириллица запрещена' }
            }}
            render={({ field, fieldState }) => (
                <Autocomplete
                    value={field.value ?? ''}
                    onChange={(val) => {
                        field.onChange(val);
                        setValue(`${prefix}.tax_verbatim`, false);
                    }}
                    onSearch={handleSearch}
                    suggestions={suggestions}
                    isLoading={isLoading}
                    placeholder="Начните вводить…"
                    ariaInvalid={!!fieldState.error}
                />
            )}
        />
    );
};

const GenusAutocomplete: FC<{ prefix: string }> = ({ prefix }) => {
    const { control, setValue, getValues } = useFormContext<FormSchema>();
    const [searchGenus] = useLazySuggestTaxonQuery();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = useDebouncedCallback(async (text: string) => {
        setIsLoading(true);
        try {
            const familyValue = getValues(`${prefix}.family` as any);
            const r = await searchGenus({ field: 'genus', text, family: familyValue }).unwrap();
            setSuggestions(r.suggestions ?? []);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    return (
        <Controller
            name={`${prefix}.genus`}
            control={control}
            rules={{ 
                required: 'Обязательное поле',
                pattern: { value: /^[^А-Яа-яЁё]+$/, message: 'Кириллица запрещена' }
            }}
            render={({ field, fieldState }) => (
                <Autocomplete
                    value={field.value ?? ''}
                    onChange={(val) => {
                        field.onChange(val);
                        setValue(`${prefix}.tax_verbatim`, false);
                    }}
                    onSearch={handleSearch}
                    suggestions={suggestions}
                    isLoading={isLoading}
                    placeholder="Название рода"
                    ariaInvalid={!!fieldState.error}
                />
            )}
        />
    );
};

const SpeciesAutocomplete: FC<{ prefix: string }> = ({ prefix }) => {
    const { control, setValue, getValues } = useFormContext<FormSchema>();
    const [searchSpecies] = useLazySuggestTaxonQuery();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = useDebouncedCallback(async (text: string) => {
        setIsLoading(true);
        try {
            const familyValue = getValues(`${prefix}.family` as any);
            const genusValue = getValues(`${prefix}.genus` as any);
            const r = await searchSpecies({
                field: 'species',
                text,
                family: familyValue,
                genus: genusValue,
            }).unwrap();
            setSuggestions(r.suggestions ?? []);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    return (
        <Controller
            name={`${prefix}.species`}
            control={control}
            rules={{ 
                required: 'Обязательное поле',
                pattern: { value: /^[^А-Яа-яЁё]+$/, message: 'Кириллица запрещена' }
            }}
            render={({ field, fieldState }) => (
                <Autocomplete
                    value={field.value ?? ''}
                    onChange={(val) => {
                        field.onChange(val);
                        setValue(`${prefix}.tax_verbatim`, false);
                    }}
                    onSearch={handleSearch}
                    suggestions={suggestions}
                    isLoading={isLoading}
                    placeholder="Только эпитет, без рода"
                    ariaInvalid={!!fieldState.error}
                />
            )}
        />
    );
};

const TaxonomyCard: FC<Props> = ({ index }) => {
    const {
        register,
        control,
        setValue,
        getValues,
    } = useFormContext<FormSchema>();
    const prefix = `samples.${index}` as const;

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Семейство (Familia)</Label>
                        <FamilyAutocomplete prefix={prefix} />
                    </div>
                    <div className="space-y-2">
                        <Label>Род (Genus)</Label>
                        <GenusAutocomplete prefix={prefix} />
                    </div>
                    <div className="space-y-2">
                        <Label>Видовое название (эпитет)</Label>
                        <SpeciesAutocomplete prefix={prefix} />
                    </div>
                </div>

                {/* ── Row 2: Rank, Type status, Accepted name ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                    <div className="space-y-2">
                        <Label>Ранг таксона</Label>
                        <Controller
                            name={`${prefix}.taxon_rank`}
                            control={control}
                            render={({ field, fieldState }) => (
                                <Select
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger aria-invalid={!!fieldState.error}>
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
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Типовой статус</Label>
                        <Controller
                            name={`${prefix}.type_status`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger>
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
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Controller
                            name={`${prefix}.accepted_name`}
                            control={control}
                            render={({ field, fieldState }) => (
                                <Input
                                    id={`${prefix}.accepted_name`}
                                    placeholder="Если приведённое в статье устарело"
                                    aria-invalid={!!fieldState.error}
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* ── Row 3: Checkboxes ── */}
                <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-4">
                    <Controller
                        name={`${prefix}.tax_verbatim`}
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${prefix}_tax_verbatim`}
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                />
                                <Label
                                    htmlFor={`${prefix}_tax_verbatim`}
                                    className="font-normal cursor-pointer"
                                >
                                    Латинское название введено вручную
                                </Label>
                            </div>
                        )}
                    />
                </div>

                {/* ── Row 4: Remarks ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.taxon_remarks`}>
                            Таксономические примечания
                        </Label>
                        <Textarea
                            id={`${prefix}.taxon_remarks`}
                            className="min-h-[72px] resize-none"
                            placeholder="Примечания ко всему таксону…"
                            {...register(`${prefix}.taxon_remarks`)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${prefix}.identification_remarks`}>
                            Примечания к идентификации
                        </Label>
                        <Textarea
                            id={`${prefix}.identification_remarks`}
                            className="min-h-[72px] resize-none"
                            placeholder="Примечания к определению…"
                            {...register(`${prefix}.identification_remarks`)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TaxonomyCard;
