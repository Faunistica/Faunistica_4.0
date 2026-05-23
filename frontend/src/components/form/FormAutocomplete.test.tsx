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
        it('typing updates input display but does NOT immediately commit to form state', async () => {
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

            // But form value should still be empty (not committed)
            expect(getFormMethods().getValues('family')).toBe('');

            // Type more
            await act(async () => {
                fireEvent.change(input, { target: { value: 'ABC' } });
            });

            expect(input.value).toBe('ABC');
            expect(getFormMethods().getValues('family')).toBe(''); // Still not committed
        });

        it('blur commits the input value to form state', async () => {
            const searchFn = createMockSearch();
            const onChangeExtra = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onChangeExtra={onChangeExtra}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Type some text
            await act(async () => {
                fireEvent.change(input, { target: { value: 'Canidae' } });
            });

            // Not committed yet
            expect(getFormMethods().getValues('family')).toBe('');
            expect(onChangeExtra).not.toHaveBeenCalled();

            // Blur the input
            await act(async () => {
                fireEvent.blur(input);
            });

            // Now it's committed
            expect(getFormMethods().getValues('family')).toBe('Canidae');
            expect(onChangeExtra).toHaveBeenCalledWith('Canidae');
        });

        it('blurring without changes does not trigger unnecessary commits', async () => {
            const searchFn = createMockSearch();
            const onChangeExtra = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onChangeExtra={onChangeExtra}
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

            // onChangeExtra should not be called since value didn't change
            expect(onChangeExtra).not.toHaveBeenCalled();
        });
    });

    describe('suggestion selection', () => {
        it('selecting a suggestion immediately commits the value', async () => {
            const searchFn = createMockSearch(['Canidae', 'Canis']);
            const onChangeExtra = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onChangeExtra={onChangeExtra}
                    debounceMs={0}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Type to trigger search
            await act(async () => {
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
            expect(onChangeExtra).toHaveBeenCalledWith('Canidae');
        });

        it('clears suggestions after selection', async () => {
            const searchFn = createMockSearch(['Option1', 'Option2']);
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    debounceMs={0}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Trigger search
            await act(async () => {
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
        it('commits empty string when input is cleared and blurred', async () => {
            const searchFn = createMockSearch();
            const onChangeExtra = vi.fn();
            const { getFormMethods } = renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onChangeExtra={onChangeExtra}
                />,
                { family: 'Existing' },
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            // Clear the input
            await act(async () => {
                fireEvent.change(input, { target: { value: '' } });
            });

            // Not committed yet
            expect(getFormMethods().getValues('family')).toBe('Existing');

            // Blur to commit
            await act(async () => {
                fireEvent.blur(input);
            });

            // Now committed as empty
            expect(getFormMethods().getValues('family')).toBe('');
            expect(onChangeExtra).toHaveBeenCalledWith('');
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
            expect(searchFn).toHaveBeenCalledWith('ABC');

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
                expect(searchFn).toHaveBeenCalledWith('TestQuery');
            });

            vi.useRealTimers();
        });
    });

    describe('onChangeExtra callback', () => {
        it('is NOT called during typing (only on commit)', async () => {
            const searchFn = createMockSearch();
            const onChangeExtra = vi.fn();

            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onChangeExtra={onChangeExtra}
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

            // onChangeExtra should not have been called
            expect(onChangeExtra).not.toHaveBeenCalled();

            // Only on blur
            await act(async () => {
                fireEvent.blur(input);
            });

            expect(onChangeExtra).toHaveBeenCalledTimes(1);
            expect(onChangeExtra).toHaveBeenCalledWith('ABC');
        });

        it('is called when selecting a suggestion', async () => {
            const searchFn = createMockSearch(['Suggested']);
            const onChangeExtra = vi.fn();

            renderWithForm(
                <FormAutocomplete
                    name="family"
                    label="Семейство"
                    searchFn={searchFn}
                    placeholder="Начните вводить…"
                    onChangeExtra={onChangeExtra}
                    debounceMs={0}
                />,
            );

            const input = screen.getByPlaceholderText('Начните вводить…') as HTMLInputElement;

            await act(async () => {
                fireEvent.change(input, { target: { value: 'Sugg' } });
            });

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeTruthy();
            });

            await act(async () => {
                fireEvent.mouseDown(screen.getByText('Suggested'));
            });

            expect(onChangeExtra).toHaveBeenCalledTimes(1);
            expect(onChangeExtra).toHaveBeenCalledWith('Suggested');
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
            expect(searchFn).toHaveBeenCalledWith('Third');

            vi.useRealTimers();
        });
    });
});
