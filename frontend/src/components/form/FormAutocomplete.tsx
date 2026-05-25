import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Autocomplete from '@/components/ui/autocomplete';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type { FormKey } from '@/types/forms';

interface FormAutocompleteProps {
    name: FormKey<string | null | undefined>;
    isLoading?: boolean;
    label: string;
    placeholder?: string;
    searchFn: (text: string) => Promise<string[]>;
    debounceMs?: number;
    onSelectExtra?: (value: string) => void;
}

export function FormAutocomplete({
    name,
    isLoading,
    label,
    placeholder,
    searchFn,
    debounceMs = 300,
    onSelectExtra,
}: FormAutocompleteProps) {
    const { control, register, setValue } = useFormContext();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const searchVersionRef = useRef(0);
    const lastCommittedRef = useRef('');

    const formValue = useWatch({ control, name });
    const { errors } = useFormState({ control, name });
    const error = errors?.[name];

    useEffect(() => {
        if (formValue !== lastCommittedRef.current) {
            lastCommittedRef.current = formValue ?? '';
            setValue(name, formValue ?? '');
            if (!formValue) {
                setSuggestions([]);
                searchVersionRef.current = 0;
            }
        }
    }, [name, formValue, setValue]);

    const debouncedSearch = useDebouncedCallback(async (text: string, version: number) => {
        try {
            const result = await searchFn(text);
            if (searchVersionRef.current === version) {
                setSuggestions(result);
            }
        } catch (e) {
            console.error(e);
        }
    }, debounceMs);

    const handleSearch = useCallback(
        (text: string) => {
            const version = ++searchVersionRef.current;
            debouncedSearch(text, version);
        },
        [debouncedSearch],
    );

    const { onBlur, ...registerProps } = register(name);

    const handleBlur = useCallback(
        async (e: React.FocusEvent<HTMLInputElement>) => {
            if (formValue !== lastCommittedRef.current) {
                lastCommittedRef.current = formValue;
                onSelectExtra?.(formValue);
            }
            await onBlur(e);
        },
        [onBlur, onSelectExtra, formValue],
    );

    return (
        <Field>
            <FieldLabel>{label}</FieldLabel>
            <Autocomplete
                {...registerProps}
                id={name}
                onSelect={(val) => {
                    setValue(name, val);
                    lastCommittedRef.current = val;
                    setSuggestions([]);
                    searchVersionRef.current = 0;
                    onSelectExtra?.(val);
                }}
                onBlur={handleBlur}
                onSearch={handleSearch}
                suggestions={suggestions}
                isLoading={isLoading}
                placeholder={placeholder}
                aria-invalid={!!error}
            />
            <FieldError errors={[error]} />
        </Field>
    );
}
