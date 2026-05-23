import { type FC, useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface AutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (value: string) => void;
    onSearch: (text: string) => void;
    onBlur?: () => void;
    suggestions: string[];
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    id?: string;
    ariaInvalid?: boolean;
    minChars?: number;
}

/**
 * Text input with a dropdown list of suggestions.
 * Fully controlled: parent provides value, onChange, suggestions, and search trigger.
 */
const Autocomplete: FC<AutocompleteProps> = ({
    value,
    onChange,
    onSelect,
    onSearch,
    onBlur,
    suggestions,
    placeholder,
    isLoading = false,
    disabled = false,
    className,
    id,
    ariaInvalid,
    minChars = 2,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Open dropdown when suggestions arrive
    useEffect(() => {
        if (suggestions.length > 0) {
            setIsOpen(true);
            setHighlightIndex(-1);
        }
    }, [suggestions]);

    const handleInputChange = (text: string) => {
        onChange(text);
        if (text.length >= minChars) {
            onSearch(text);
        } else {
            setIsOpen(false);
        }
    };

    const handleSelect = (item: string) => {
        onSelect?.(item);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        } else if (e.key === 'Enter' && highlightIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[highlightIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={wrapperRef} className={cn('relative', className)}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    id={id}
                    value={value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={onBlur}
                    onFocus={() => {
                        if (suggestions.length > 0 && value && value.length >= minChars)
                            setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-invalid={ariaInvalid}
                    autoComplete="off"
                />
                {isLoading && (
                    <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
                        <Spinner className="h-4 w-4" />
                    </div>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul
                    className="absolute z-[150] mt-2 max-h-60 w-full animate-in overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white/95 py-1.5 shadow-xl backdrop-blur-md duration-200 zoom-in-95 fade-in"
                    role="listbox"
                >
                    {suggestions.map((item, i) => (
                        <li
                            key={item}
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
