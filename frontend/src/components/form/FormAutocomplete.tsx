import { Controller, useFormContext } from 'react-hook-form';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import Autocomplete from '@/components/ui/autocomplete';
import type { FormRecord } from '@/types/api.dto';

interface FormAutocompleteProps {
    name: keyof FormRecord;
    label: string;
    placeholder?: string;
    onSearch: (text: string) => void;
    suggestions: string[];
    isLoading?: boolean;
    onChangeExtra?: (value: string) => void;
}

export function FormAutocomplete({
    name,
    label,
    placeholder,
    onSearch,
    suggestions,
    isLoading,
    onChangeExtra,
}: FormAutocompleteProps) {
    const { control } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{label}</FieldLabel>
                    <Autocomplete
                        value={field.value ?? ''}
                        onChange={(val) => {
                            field.onChange(val);
                            onChangeExtra?.(val);
                        }}
                        onSearch={onSearch}
                        suggestions={suggestions}
                        isLoading={isLoading}
                        placeholder={placeholder}
                        ariaInvalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                </Field>
            )}
        />
    );
}
