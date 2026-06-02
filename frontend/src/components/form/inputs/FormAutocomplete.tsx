import { useState, useRef, useEffect, useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Autocomplete from '@/components/ui/autocomplete';
import { useDebouncedRaceSafe } from '@/hooks/useDebouncedRaceSafe';
import type { RecordFormKey, RecordForm } from '@/types/forms';

interface FormAutocompleteProps {
    name: RecordFormKey<string | null | undefined>;
    isLoading?: boolean;
    label: string;
    placeholder?: string;
    searchFn: (text: string, signal?: AbortSignal) => Promise<string[]>;
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
    const { control, setValue } = useFormContext<RecordForm>();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const lastCommittedRef = useRef<string | null>(null);
    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    const initializedRef = useRef(false);

    // Only sync on mount (or when currentValue first becomes available)
    // This sets the initial "committed" state without tracking every form change
    useEffect(() => {
        if (!initializedRef.current && field.value !== undefined) {
            lastCommittedRef.current = field.value ?? null;
            initializedRef.current = true;
        }
    }, [field.value]);

    const { fn: handleSearch, cancel: cancelSearch } = useDebouncedRaceSafe(
        async (text: string, signal: AbortSignal) => {
            return await searchFn(text, signal);
        },
        setSuggestions,
        debounceMs,
    );

    const handleBlur = useCallback(async () => {
        const normalizedLast = lastCommittedRef.current;

        if (field.value !== normalizedLast) {
            lastCommittedRef.current = field.value ?? '';
            // User typed and blurred without selecting from dropdown
            onCommitTyped?.(field.value ?? '');
        }
    }, [field, onCommitTyped]);

    return (
        <Field data-invalid={invalid}>
            <FieldLabel>{label}</FieldLabel>
            <Autocomplete
                id={name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onSelect={(val) => {
                    setValue(name, val);
                    lastCommittedRef.current = val;
                    setSuggestions([]);
                    cancelSearch();
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
