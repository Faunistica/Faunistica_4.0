import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
    options: string[] | ((text: string, signal?: AbortSignal) => Promise<string[]>);
    debounceMs?: number;
    onSelectSuggestion?: (value: string) => void;
    onCommitTyped?: (value: string) => void;
}

export function FormAutocomplete({
    name,
    isLoading,
    label,
    placeholder,
    options,
    debounceMs = 300,
    onSelectSuggestion,
    onCommitTyped,
}: FormAutocompleteProps) {
    const { control, setValue } = useFormContext<RecordForm>();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const lastCommittedRef = useRef('');
    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    const initializedRef = useRef(false);
    const isStaticArray = useMemo(() => Array.isArray(options), [options]);

    useEffect(() => {
        if (!initializedRef.current && field.value !== undefined) {
            lastCommittedRef.current = field.value ?? '';
            initializedRef.current = true;
        }
    }, [field.value]);

    useEffect(() => {
        if (isStaticArray) {
            setSuggestions(options as string[]);
        }
    }, [options, isStaticArray]);

    const { fn: debouncedSearch, cancel: cancelSearch } = useDebouncedRaceSafe(
        async (text: string, signal: AbortSignal) => {
            if (typeof options === 'function') {
                return await options(text, signal);
            }
            return [];
        },
        setSuggestions,
        debounceMs,
    );

    const handleSearch = useCallback(
        (text: string) => {
            if (isStaticArray) {
                setSuggestions(
                    (options as string[]).filter((o) =>
                        o.toLowerCase().includes(text.toLowerCase()),
                    ),
                );
            } else {
                debouncedSearch(text);
            }
        },
        [options, isStaticArray, debouncedSearch],
    );

    const handleBlur = useCallback(async () => {
        const normalizedLast = lastCommittedRef.current;
        const current = field.value ?? '';
        if (current !== normalizedLast) {
            lastCommittedRef.current = current;
            onCommitTyped?.(current);
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
                    if (!isStaticArray) {
                        cancelSearch();
                    }
                    onSelectSuggestion?.(val);
                }}
                onBlur={handleBlur}
                onFocus={isStaticArray ? () => setSuggestions(options as string[]) : undefined}
                onSearch={handleSearch}
                suggestions={suggestions}
                isLoading={isLoading}
                minChars={isStaticArray ? 0 : undefined}
                placeholder={placeholder}
                aria-invalid={!!error}
            />
            {!!error && <FieldError errors={[error]} />}
        </Field>
    );
}
