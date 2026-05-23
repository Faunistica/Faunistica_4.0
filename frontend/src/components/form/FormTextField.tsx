import { useFormContext, useFormState } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import type { FormRecord } from '@/types/api.dto';

interface FormTextFieldProps {
    name: keyof FormRecord;
    label: string;
    placeholder?: string;
    inputType?: 'input' | 'textarea';
}

export function FormTextField({
    name,
    label,
    placeholder,
    inputType = 'input',
}: FormTextFieldProps) {
    const { register, control } = useFormContext();
    const { errors } = useFormState({ control, name: name as string });
    const error = errors?.[name];

    return (
        <Field data-invalid={!!error}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            {inputType === 'textarea' ? (
                <Textarea
                    id={name}
                    className="min-h-[72px] resize-none"
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    {...register(name)}
                />
            ) : (
                <Input
                    id={name}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    {...register(name)}
                />
            )}
            <FieldError errors={[error]} />
        </Field>
    );
}
