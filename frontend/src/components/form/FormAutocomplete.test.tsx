import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormAutocomplete } from './FormAutocomplete';
import type { FormRecord } from '@/types/api.dto';
import type { ReactNode } from 'react';

const createMockSearch = (suggestions: string[] = []) =>
    vi.fn().mockImplementation(() => Promise.resolve(suggestions));

function createWrapper(defaultValues: Partial<FormRecord> = { family: '' }) {
    let formMethods: ReturnType<typeof useForm<FormRecord>> | null = null;

    function Wrapper({ children }: { children: ReactNode }) {
        const methods = useForm<FormRecord>({
            defaultValues: defaultValues,
            mode: 'onTouched',
        });
        formMethods = methods;
        return <FormProvider {...methods}>{children}</FormProvider>;
    }

    return { Wrapper, getFormMethods: () => formMethods! };
}

function renderWithForm(
    ui: React.ReactElement,
    defaultValues: Partial<FormRecord> = { family: '' },
) {
    const { Wrapper, getFormMethods } = createWrapper(defaultValues);
    const renderResult = render(ui, { wrapper: Wrapper });
    return { ...renderResult, getFormMethods };
}

describe('FormAutocomplete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders label and input', () => {
        const { container } = renderWithForm(
            <FormAutocomplete
                name="family"
                label="Семейство"
                searchFn={vi.fn().mockResolvedValue([])}
                placeholder="Начните вводить…"
            />,
        );

        expect(screen.getByText('Семейство')).toBeTruthy();
        expect(screen.getByPlaceholderText('Начните вводить…')).toBeTruthy();
        expect(container).toBeTruthy();
    });

    it('renders custom placeholder', () => {
        renderWithForm(
            <FormAutocomplete
                name="family"
                label="Family"
                searchFn={vi.fn().mockResolvedValue([])}
                placeholder="Type here…"
            />,
        );

        expect(screen.getByPlaceholderText('Type here…')).toBeTruthy();
    });

    describe('input value commitment', () => {
        it('typing updates input display and immediately commits to form state via register', async () => {
            const searchFn = createMockSearch();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Type multiple characters
            await act(async () => {
                fireEvent.change(input, { target: { value: 'A' } });
            });

            // Input should show the typed value
            expect(input.value).toBe('A');

            // Form value is immediately updated via register's onChange
            expect(getFormMethods().getValues('family')).toBe('A');

            // Type more
            await act(async () => {
                fireEvent.change(input, { target: { value: 'ABC' } });
            });

            expect(input.value).toBe('ABC');
            expect(getFormMethods().getValues('family')).toBe('ABC');
        });

        it('blur commits the typed value and calls onCommitTyped', async () => {
            const searchFn = createMockSearch();
            const onCommitTyped = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onCommitTyped={onCommitTyped}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Type some text (immediately committed via register)
            await act(async () => {
                fireEvent.change(input, { target: { value: 'Canidae' } });
            });

            expect(getFormMethods().getValues('family')).toBe('Canidae');
            expect(onCommitTyped).not.toHaveBeenCalled();

            // Blur the input
            await act(async () => {
                fireEvent.blur(input);
            });

            // onCommitTyped is called on blur when value changed from last committed
            expect(onCommitTyped).toHaveBeenCalledTimes(1);
            expect(onCommitTyped).toHaveBeenCalledWith('Canidae');
        });

        it('blurring without changes does not trigger onCommitTyped', async () => {
            const searchFn = createMockSearch();
            const onCommitTyped = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onCommitTyped={onCommitTyped}
                />,
                { family: 'Initial' },
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Initial form value should be loaded
            expect(getFormMethods().getValues('family')).toBe('Initial');

            // Blur without changes
            await act(async () => {
                fireEvent.blur(input);
            });

            // onCommitTyped should not be called since value didn't change from initial
            expect(onCommitTyped).not.toHaveBeenCalled();
        });
    });

    describe('suggestion selection', () => {
        it('selecting a suggestion immediately commits the value and calls onSelectSuggestion', async () => {
            const searchFn = createMockSearch(['Canidae', 'Canis']);
            const onSelectSuggestion = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onSelectSuggestion={onSelectSuggestion}
                    debounceMs={0}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Focus and type to trigger search
            await act(async () => {
                fireEvent.focus(input);
                fireEvent.change(input, { target: { value: 'Can' } });
            });

            // Wait for suggestions to appear
            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeTruthy();
            });

            // Click a suggestion
            const suggestion = screen.getByText('Canidae');
            await act(async () => {
                fireEvent.mouseDown(suggestion);
            });

            // Value should be committed immediately
            expect(getFormMethods().getValues('family')).toBe('Canidae');
            expect(input.value).toBe('Canidae');
            expect(onSelectSuggestion).toHaveBeenCalledWith('Canidae');
        });

        it('clears suggestions after selection', async () => {
            const searchFn = createMockSearch(['Option1', 'Option2']);
            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    debounceMs={0}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Focus and trigger search
            await act(async () => {
                fireEvent.focus(input);
                fireEvent.change(input, { target: { value: 'Opt' } });
            });

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeTruthy();
            });

            // Select
            await act(async () => {
                fireEvent.mouseDown(screen.getByText('Option1'));
            });

            // Suggestions should be cleared
            expect(screen.queryByRole('listbox')).toBeNull();
        });
    });

    describe('external value sync', () => {
        it('syncs input value when form is reset externally', async () => {
            const searchFn = createMockSearch();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Type and commit via blur
            await act(async () => {
                fireEvent.change(input, { target: { value: 'OldValue' } });
                fireEvent.blur(input);
            });

            expect(input.value).toBe('OldValue');

            // Reset form externally
            await act(async () => {
                getFormMethods().reset({ family: 'NewValue' } as FormRecord);
            });

            // Input should sync to new value
            expect(input.value).toBe('NewValue');
        });

        it('clears input and suggestions when form value is cleared externally', async () => {
            const searchFn = createMockSearch(['Suggestion']);
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                />,
                { family: 'Initial' },
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Initially has value
            expect(input.value).toBe('Initial');

            // Clear externally
            await act(async () => {
                getFormMethods().setValue('family', '');
            });

            // Input should be cleared
            expect(input.value).toBe('');
        });
    });

    describe('clearing input', () => {
        it('commits empty string when input is cleared and blurred, calls onCommitTyped', async () => {
            const searchFn = createMockSearch();
            const onCommitTyped = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onCommitTyped={onCommitTyped}
                />,
                { family: 'Existing' },
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Clear the input (immediately committed via register)
            await act(async () => {
                fireEvent.change(input, { target: { value: '' } });
            });

            // Form value is already cleared via register's onChange
            expect(getFormMethods().getValues('family')).toBe('');

            // Blur to trigger onCommitTyped
            await act(async () => {
                fireEvent.blur(input);
            });

            // Now onCommitTyped is called
            expect(onCommitTyped).toHaveBeenCalledTimes(1);
            expect(onCommitTyped).toHaveBeenCalledWith('');
        });
    });

    describe('debounced search', () => {
        it('does not call searchFn immediately on every keystroke', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const searchFn = vi.fn().mockResolvedValue([]);

            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    debounceMs={300}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Type rapidly
            await act(async () => {
                fireEvent.change(input, { target: { value: 'A' } });
            });
            await act(async () => {
                fireEvent.change(input, { target: { value: 'AB' } });
            });
            await act(async () => {
                fireEvent.change(input, { target: { value: 'ABC' } });
            });

            // Search should not have been called yet
            expect(searchFn).not.toHaveBeenCalled();

            // Advance past debounce
            await act(async () => {
                vi.advanceTimersByTime(300);
            });

            // Now search called once with final value
            await waitFor(() => {
                expect(searchFn).toHaveBeenCalledTimes(1);
            });
            expect(searchFn).toHaveBeenCalledWith('ABC', expect.any(AbortSignal));

            vi.useRealTimers();
        });

        it('calls searchFn with correct parameters', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const searchFn = vi.fn().mockResolvedValue(['Result']);

            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    debounceMs={100}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            await act(async () => {
                fireEvent.change(input, { target: { value: 'TestQuery' } });
            });

            await act(async () => {
                vi.advanceTimersByTime(100);
            });

            await waitFor(() => {
                expect(searchFn).toHaveBeenCalledWith('TestQuery', expect.any(AbortSignal));
            });

            vi.useRealTimers();
        });
    });

    describe('callback behavior', () => {
        it('onCommitTyped is NOT called during typing (only on blur)', async () => {
            const searchFn = createMockSearch();
            const onCommitTyped = vi.fn();

            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onCommitTyped={onCommitTyped}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Type multiple times
            await act(async () => {
                fireEvent.change(input, { target: { value: 'A' } });
            });
            await act(async () => {
                fireEvent.change(input, { target: { value: 'AB' } });
            });
            await act(async () => {
                fireEvent.change(input, { target: { value: 'ABC' } });
            });

            // onCommitTyped should not have been called during typing
            expect(onCommitTyped).not.toHaveBeenCalled();

            // Only on blur
            await act(async () => {
                fireEvent.blur(input);
            });

            expect(onCommitTyped).toHaveBeenCalledTimes(1);
            expect(onCommitTyped).toHaveBeenCalledWith('ABC');
        });

        it('onSelectSuggestion is called when selecting a suggestion, not onCommitTyped', async () => {
            const searchFn = createMockSearch(['Suggested']);
            const onSelectSuggestion = vi.fn();
            const onCommitTyped = vi.fn();

            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onSelectSuggestion={onSelectSuggestion}
                    onCommitTyped={onCommitTyped}
                    debounceMs={0}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            await act(async () => {
                fireEvent.focus(input);
                fireEvent.change(input, { target: { value: 'Sugg' } });
            });

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeTruthy();
            });

            await act(async () => {
                fireEvent.mouseDown(screen.getByText('Suggested'));
            });

            // onSelectSuggestion should be called, not onCommitTyped
            expect(onSelectSuggestion).toHaveBeenCalledTimes(1);
            expect(onSelectSuggestion).toHaveBeenCalledWith('Suggested');
            expect(onCommitTyped).not.toHaveBeenCalled();
        });
    });

    describe('race condition handling', () => {
        it('cancels previous search when new query is made', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });

            const searchFn = vi.fn().mockResolvedValue(['Result']);

            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    debounceMs={100}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // First query
            await act(async () => {
                fireEvent.change(input, { target: { value: 'First' } });
            });

            // Second query before first debounce completes
            await act(async () => {
                fireEvent.change(input, { target: { value: 'Second' } });
            });

            // Third query
            await act(async () => {
                fireEvent.change(input, { target: { value: 'Third' } });
            });

            // Only one search should be scheduled at a time due to debounce reset
            await act(async () => {
                vi.advanceTimersByTime(100);
            });

            await waitFor(() => {
                expect(searchFn).toHaveBeenCalled();
            });

            // Should only have been called once with the final value
            expect(searchFn).toHaveBeenCalledTimes(1);
            expect(searchFn).toHaveBeenCalledWith('Third', expect.any(AbortSignal));

            vi.useRealTimers();
        });
    });
});
