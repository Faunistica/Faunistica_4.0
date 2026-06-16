import { type ComponentProps, useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type OverrideProps<TBase, TOverrides> = Omit<TBase, keyof TOverrides> & TOverrides;

type SuggestionValue = string | { value: string; label: string };

type AutocompleteProps = OverrideProps<
    ComponentProps<'input'>,
    {
        id: string;
        suggestions: SuggestionValue[];
        isLoading?: boolean;
        onSelect?: (value: string) => void;
        onSearch: (text: string) => void;
        minChars?: number;
        blurOnSelect?: boolean;
    }
>;

/**
 * Text input with a dropdown list of suggestions.
 * Fully controlled: parent provides onChange, suggestions, and search trigger.
 */
const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
    (
        {
            onChange,
            onSelect,
            onSearch,
            suggestions,
            isLoading = false,
            className,
            minChars = 2,
            blurOnSelect = false,
            onBlur: onBlurProp,
            onFocus: onFocusProp,
            onKeyDown: onKeyDownProp,
            ...props
        },
        forwardedRef,
    ) => {
        const [isFocused, setIsFocused] = useState(false);
        const [highlightIndex, setHighlightIndex] = useState(-1);
        const wrapperRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

        const open = isFocused && suggestions.length > 0;

        // Clamp highlight index to always be valid for the current suggestions array
        // This avoids needing an effect to reset it when suggestions change
        const clampedHighlightIndex = Math.min(
            highlightIndex,
            Math.max(suggestions.length - 1, -1),
        );

        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClick = (e: MouseEvent) => {
                // oxlint-disable-next-line typescript/no-unsafe-type-assertion
                if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                    setIsFocused(false);
                }
            };
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, []);

        // Scroll highlighted item into view
        useEffect(() => {
            if (clampedHighlightIndex >= 0) {
                itemRefs.current[clampedHighlightIndex]?.scrollIntoView({ block: 'nearest' });
            }
        }, [clampedHighlightIndex]);

        const handleInputChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                if (onChange) {
                    onChange(e);
                }

                const text = e.target.value;
                if (text.length >= minChars) {
                    onSearch(text);
                }
            },
            [minChars, onChange, onSearch],
        );

        const getValue = useCallback((item: SuggestionValue): string => {
            return typeof item === 'string' ? item : item.value;
        }, []);

        const getLabel = useCallback((item: SuggestionValue): string => {
            return typeof item === 'string' ? item : item.label;
        }, []);

        const handleSelect = useCallback(
            (item: SuggestionValue) => {
                const val = getValue(item);
                const label = getLabel(item);
                onSelect?.(val);
                if (inputRef.current) {
                    inputRef.current.value = label;
                }
                if (blurOnSelect) {
                    inputRef.current?.blur();
                } else {
                    inputRef.current?.focus();
                }
            },
            [onSelect, blurOnSelect],
        );

        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                if (!open || suggestions.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightIndex((prev) => (prev + 1) % suggestions.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                } else if (e.key === 'Enter' && clampedHighlightIndex >= 0) {
                    e.preventDefault();
                    handleSelect(suggestions[clampedHighlightIndex]);
                }
            },
            [suggestions, open, handleSelect, clampedHighlightIndex],
        );

        return (
            <div ref={wrapperRef} className="relative">
                <div className="relative">
                    <Input
                        className={className}
                        {...props}
                        onChange={handleInputChange}
                        onFocus={(e) => {
                            setIsFocused(true);
                            onFocusProp?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            onBlurProp?.(e);
                        }}
                        onKeyDown={(e) => {
                            onKeyDownProp?.(e);
                            handleKeyDown(e);
                        }}
                        autoComplete="off"
                        ref={(el) => {
                            inputRef.current = el;
                            if (typeof forwardedRef === 'function') {
                                forwardedRef(el);
                            } else if (forwardedRef) {
                                forwardedRef.current = el;
                            }
                        }}
                    />
                    {isLoading && (
                        <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
                            <Spinner className="size-4" />
                        </div>
                    )}
                </div>

                {open && suggestions.length > 0 && (
                    <ul
                        className="absolute z-150 mt-2 max-h-60 w-full animate-in overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white/95 py-1.5 shadow-xl backdrop-blur-md duration-200 zoom-in-95 fade-in"
                        role="listbox"
                    >
                        {suggestions.map((item, i) => (
                            <li
                                key={getValue(item)}
                                ref={(el) => {
                                    itemRefs.current[i] = el;
                                }}
                                role="option"
                                aria-selected={i === clampedHighlightIndex}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelect(item);
                                }}
                                onMouseEnter={() => setHighlightIndex(i)}
                                className={cn(
                                    'cursor-pointer px-4 py-2 text-sm transition-all duration-150',
                                    i === clampedHighlightIndex
                                        ? 'bg-slate-100 pl-5 font-medium text-slate-900'
                                        : 'text-slate-700 hover:bg-slate-50',
                                )}
                            >
                                {getLabel(item)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    },
);

export default Autocomplete;
