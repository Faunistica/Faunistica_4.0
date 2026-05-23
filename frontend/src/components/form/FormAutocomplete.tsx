import { useState, useRef, useEffect, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import Autocomplete from '@/components/ui/autocomplete';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type { FormRecord } from '@/types/api.dto';

interface FormAutocompleteProps {
    name: keyof FormRecord;
    label: string;
    placeholder?: string;
    searchFn: (text: string) => Promise<string[]>;
    debounceMs?: number;
    onChangeExtra?: (value: string) => void;
}

export function FormAutocomplete({
    name,
    label,
    placeholder,
    searchFn,
    debounceMs = 300,
    onChangeExtra,
}: FormAutocompleteProps) {
    const { control, watch } = useFormContext();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchVersionRef = useRef(0);

    const fieldValue = watch(name);

    useEffect(() => {
        if (!fieldValue) {
            setSuggestions([]);
            searchVersionRef.current = 0;
        }
    }, [fieldValue]);

    const debouncedSearch = useDebouncedCallback(async (text: string, version: number) => {
        setIsLoading(true);
        try {
            const result = await searchFn(text);
            if (searchVersionRef.current === version) {
                setSuggestions(result);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (searchVersionRef.current === version) {
                setIsLoading(false);
            }
        }
    }, debounceMs);

    const handleSearch = useCallback((text: string) => {
        const version = ++searchVersionRef.current;
        debouncedSearch(text, version);
    }, [debouncedSearch]);

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
                            if (suggestions.includes(val)) {
                                setSuggestions([]);
                                searchVersionRef.current = 0;
                            }
                            onChangeExtra?.(val);
                        }}
                        onSearch={handleSearch}
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
