import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormAutocomplete } from './FormAutocomplete';
import type { FormRecord } from '@/types/api.dto';
import type { ReactNode } from 'react';

const noopSearch = vi.fn().mockResolvedValue([]);

function Wrapper({ children }: { children: ReactNode }) {
    const methods = useForm<FormRecord>({
        defaultValues: { family: '' },
    });
    return <FormProvider {...methods}>{children}</FormProvider>;
}

function renderWithForm(ui: React.ReactElement) {
    return render(ui, { wrapper: Wrapper });
}

describe('FormAutocomplete', () => {
    it('renders label and input', () => {
        renderWithForm(
            <FormAutocomplete
                name="family"
                label="Семейство"
                searchFn={noopSearch}
                placeholder="Начните вводить…"
            />,
        );

        expect(screen.getByText('Семейство')).toBeTruthy();
        expect(screen.getByPlaceholderText('Начните вводить…')).toBeTruthy();
    });

    it('renders custom placeholder', () => {
        renderWithForm(
            <FormAutocomplete
                name="family"
                label="Family"
                searchFn={noopSearch}
                placeholder="Type here…"
            />,
        );

        expect(screen.getByPlaceholderText('Type here…')).toBeTruthy();
    });
});
