import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormTextField } from './FormTextField';
import type { FormRecord } from '@/types/api.dto';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
    const methods = useForm<FormRecord>({
        defaultValues: { accepted_name: '' },
    });
    return <FormProvider {...methods}>{children}</FormProvider>;
}

function renderWithForm(ui: React.ReactElement) {
    return render(ui, { wrapper: Wrapper });
}

describe('FormTextField', () => {
    it('renders label and input', () => {
        renderWithForm(
            <FormTextField
                name="accepted_name"
                label="Валидное название"
                placeholder="Если приведённое в статье устарело"
            />,
        );

        expect(screen.getByText('Валидное название')).toBeTruthy();
        const input = screen.getByPlaceholderText('Если приведённое в статье устарело');
        expect(input.tagName).toBe('INPUT');
    });

    it('renders textarea when inputType is textarea', () => {
        renderWithForm(
            <FormTextField
                name="taxon_remarks"
                label="Примечания"
                placeholder="Текст…"
                inputType="textarea"
            />,
        );

        const textarea = screen.getByPlaceholderText('Текст…');
        expect(textarea.tagName).toBe('TEXTAREA');
    });
});
