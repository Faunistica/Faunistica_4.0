import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Autocomplete from '@/components/ui/autocomplete';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type { FormKey, FormRecord } from '@/types/forms';

interface FormAutocompleteProps {
    name: FormKey<string | null | undefined>;
    isLoading?: boolean;
    label: string;
    placeholder?: string;
    searchFn: (text: string) => Promise<string[]>;
    debounceMs?: number;
    onSelectSuggestion?: (value: string) => void;
    onCommitTyped?: (value: string) => void;
}

export function FormAutocomplete({
    name,
    isLoading,
    label,
    placeholder,
    searchFn,
    debounceMs = 300,
    onSelectSuggestion,
    onCommitTyped,
}: FormAutocompleteProps) {
    const { control, setValue } = useFormContext<FormRecord>();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const searchVersionRef = useRef(0);
    const lastCommittedRef = useRef<string | null>(null);
    const {
        field,
        fieldState: { error },
    } = useController({ name, control });

    const initializedRef = useRef(false);

    // Only sync on mount (or when currentValue first becomes available)
    // This sets the initial "committed" state without tracking every form change
    useEffect(() => {
        if (!initializedRef.current && field.value !== undefined) {
            lastCommittedRef.current = field.value ?? null;
            initializedRef.current = true;
            if (!field.value) {
                setSuggestions([]);
                searchVersionRef.current = 0;
            }
        }
    }, [field.value]);

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

    const handleBlur = useCallback(
        async (_: React.FocusEvent<HTMLInputElement>) => {
            const normalizedLast = lastCommittedRef.current;

            if (field.value !== normalizedLast) {
                lastCommittedRef.current = field.value ?? '';
                // User typed and blurred without selecting from dropdown
                onCommitTyped?.(field.value ?? '');
            }
            // await field.onBlur(e);
        },
        [field, onCommitTyped],
    );

    return (
        <Field data-invalid={!!error}>
            <FieldLabel>{label}</FieldLabel>
            <Autocomplete
                id={name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onSelect={(val) => {
                    setValue(name, val);
                    lastCommittedRef.current = val;
                    setSuggestions([]);
                    searchVersionRef.current = 0;
                    onSelectSuggestion?.(val);
                }}
                onBlur={handleBlur}
                onSearch={handleSearch}
                suggestions={suggestions}
                isLoading={isLoading}
                placeholder={placeholder}
                aria-invalid={!!error}
            />
            {!!error && <FieldError errors={[error]} />}
        </Field>
    );
}
