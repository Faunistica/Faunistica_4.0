import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
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
    const {
        register,
        setValue,
        getValues,
        control,
        formState: { errors },
    } = useFormContext();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const searchVersionRef = useRef(0);
    const lastCommittedRef = useRef<string | null>(null);
    const error = errors?.[name];

    const currentValue = useWatch({ name, control });
    const initializedRef = useRef(false);

    // Only sync on mount (or when currentValue first becomes available)
    // This sets the initial "committed" state without tracking every form change
    useEffect(() => {
        if (!initializedRef.current && currentValue !== undefined) {
            lastCommittedRef.current = currentValue ?? null;
            initializedRef.current = true;
            if (!currentValue) {
                setSuggestions([]);
                searchVersionRef.current = 0;
            }
        }
    }, [currentValue]);

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
            const value = getValues(name) ?? null;
            const normalizedLast = lastCommittedRef.current;

            if (value !== normalizedLast) {
                lastCommittedRef.current = value;
                // User typed and blurred without selecting from dropdown
                onCommitTyped?.(value ?? '');
            }
            await onBlur(e);
        },
        [onBlur, getValues, name, onCommitTyped],
    );

    return (
        <Field data-invalid={!!error}>
            <FieldLabel>{label}</FieldLabel>
            <Autocomplete
                {...registerProps}
                id={name}
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
