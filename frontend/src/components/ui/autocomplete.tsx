import { type ComponentProps, type FC, useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type OverrideProps<TBase, TOverrides> = Omit<TBase, keyof TOverrides> & TOverrides;

type AutocompleteProps = OverrideProps<
    ComponentProps<'input'>,
    {
        id: string;
        suggestions: string[];
        isLoading?: boolean;
        onSelect?: (value: string) => void;
        onSearch: (text: string) => void;
        minChars?: number;
    }
>;

/**
 * Text input with a dropdown list of suggestions.
 * Fully controlled: parent provides onChange, suggestions, and search trigger.
 */
const Autocomplete: FC<AutocompleteProps> = ({
    onChange,
    onSelect,
    onSearch,
    suggestions,
    isLoading = false,
    className,
    minChars = 2,
    onBlur: onBlurProp,
    ref: refProp,
    ...props
}) => {
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Open dropdown when suggestions arrive
    useEffect(() => {
        if (suggestions.length > 0) {
            setOpen(true);
            setHighlightIndex(-1);
        }
    }, [suggestions]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightIndex >= 0) {
            itemRefs.current[highlightIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightIndex]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onChange) {
                onChange(e);
            }

            const text = e.target.value;
            if (text.length >= minChars) {
                onSearch(text);
            } else {
                setOpen(false);
            }
        },
        [minChars, onChange, onSearch],
    );

    const handleSelect = useCallback(
        (item: string) => {
            onSelect?.(item);
            if (inputRef.current) {
                inputRef.current.value = item;
            }
            setOpen(false);
            inputRef.current?.focus();
        },
        [onSelect],
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
            } else if (e.key === 'Enter' && highlightIndex >= 0) {
                e.preventDefault();
                handleSelect(suggestions[highlightIndex]);
            }
        },
        [suggestions, open, handleSelect, highlightIndex, setHighlightIndex],
    );

    return (
        <div ref={wrapperRef} className={cn('relative', className)}>
            <div className="relative">
                <Input
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setOpen(true);
                        }
                    }}
                    onBlur={(e) => {
                        setOpen(false);
                        onBlurProp?.(e);
                    }}
                    autoComplete="off"
                    {...props}
                    ref={(el) => {
                        inputRef.current = el;
                        if (typeof refProp === 'function') {
                            refProp(el);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                />
                {isLoading && (
                    <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
                        <Spinner className="h-4 w-4" />
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
                            key={item}
                            ref={(el) => {
                                itemRefs.current[i] = el;
                            }}
                            role="option"
                            aria-selected={i === highlightIndex}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
                            onMouseEnter={() => setHighlightIndex(i)}
                            className={cn(
                                'cursor-pointer px-4 py-2 text-sm transition-all duration-150',
                                i === highlightIndex
                                    ? 'bg-slate-100 pl-5 font-medium text-slate-900'
                                    : 'text-slate-700 hover:bg-slate-50',
                            )}
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Autocomplete;
