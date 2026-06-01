import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { useForm, FormProvider, Controller, useFormContext } from 'react-hook-form';
import { RecordFormProvider } from '@/contexts/RecordFormProvider';
import { FORM_DEFAULT_VALUES, type RecordForm } from '@/types/forms';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import SavedPresetSelect from '@/components/form/inputs/SavedPresetSelect';
import { useRecordForm, type RecordFormState } from '@/contexts/useRecordForm';

const mockRecordsListQuery = vi.hoisted(() => vi.fn());
const mockRecordListSelect = vi.hoisted(() => vi.fn());
const mockRecordByIdQuery = vi.hoisted(() => vi.fn());
const mockCreateRecord = vi.hoisted(() => vi.fn());
const mockUpdateRecord = vi.hoisted(() => vi.fn());
const mockDeleteRecord = vi.hoisted(() => vi.fn());
const mockDispatch = vi.hoisted(() => vi.fn());
const mockUpsertQueryData = vi.hoisted(() => vi.fn());
const mockUpdateQueryData = vi.hoisted(() => vi.fn());
const mockInvalidateTags = vi.hoisted(() => vi.fn());

vi.mock('@/store/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ user: { user_id: 123 }, recordAPI: {} }),
    store: { dispatch: mockDispatch, getState: () => ({ user: { user_id: 123 } }) },
}));

vi.mock('@/api/recordAPI', () => ({
    useRecordsListQuery: mockRecordsListQuery,
    useRecordByIdQuery: mockRecordByIdQuery,
    useCreateRecordMutation: () => [mockCreateRecord],
    useUpdateRecordMutation: () => [mockUpdateRecord],
    useDeleteRecordMutation: () => [mockDeleteRecord],
    recordAPI: {
        reducerPath: 'recordAPI',
        reducer: vi.fn(),
        middleware: vi.fn(),
        endpoints: {
            recordsList: {
                select: mockRecordListSelect,
            },
        },
        util: {
            upsertQueryData: mockUpsertQueryData,
            updateQueryData: mockUpdateQueryData,
            invalidateTags: mockInvalidateTags,
        },
    },
}));

const RECORD_FIELDS = {
    publ_id: 1,
    user_id: 123,
    created_at: '2024-01-01T00:00:00Z',
    errors: null,
    type: 'check_fail' as const,
    ip: null,
    region: null,
    district: null,
    locality: null,
    is_manual_location: null,
    latitude: null,
    longitude: null,
    verbatimcoordinates: null,
    coordinate_uncertainty: null,
    georef_source: null,
    location_remarks: null,
    verbatim_date: null,
    date_precision: null,
    is_interval: null,
    habitat: null,
    sampling_protocol: null,
    sampling_effort: null,
    sample_size_value: null,
    sample_size_unit: null,
    event_remarks: null,
    field_number: null,
    catalog_number: null,
    collection_code: null,
    recorded_by: null,
    family: null,
    genus: null,
    species: null,
    tax_verbatim: null,
    taxon_rank: null,
    type_status: null,
    accepted_name: null,
    taxon_remarks: null,
    identification_remarks: null,
    quantity_type: null,
    specimens: null,
    occurrence_remarks: null,
};

const RECORD_1 = {
    id: 'rec-1',
    ...RECORD_FIELDS,
    updated_at: '2024-01-01T00:00:00Z',
    country: 'RU',
};
const RECORD_2 = {
    id: 'rec-2',
    ...RECORD_FIELDS,
    updated_at: '2024-01-01T00:00:02Z',
    country: 'DE',
};

type RecordLike = Record<string, unknown>;
const queryResults: Record<string, { currentData: RecordLike | undefined }> = {};
function setQueryResult(recordId: string | null, data: RecordLike | undefined) {
    const key = recordId ?? '__null__';
    queryResults[key] = { currentData: data };
}

function queryResult(recordId: string | null) {
    const key = recordId ?? '__null__';
    return queryResults[key] ?? { currentData: undefined };
}

let testState: RecordFormState | null = null;
const testMethodsRef: { current: ReturnType<typeof useForm<RecordForm>> | null } = {
    current: null,
};

function StateDisplay() {
    const { state } = useRecordForm();
    testState = state;
    return <div data-testid="state-display" />;
}

function TestHarness({ children }: { children: React.ReactNode }) {
    const methods = useForm<RecordForm>({ defaultValues: FORM_DEFAULT_VALUES });
    testMethodsRef.current = methods;
    return (
        <MemoryRouter initialEntries={['/publication/1/rec-1']}>
            <Routes>
                <Route
                    path="/publication/:publ_id/:record"
                    element={
                        <FormProvider {...methods}>
                            <RecordFormProvider publ_id={1}>
                                <FormProvider {...methods}>{children}</FormProvider>
                            </RecordFormProvider>
                        </FormProvider>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

function TestFields() {
    const { control } = useFormContext<RecordForm>();
    return (
        <>
            <Controller
                name="locality"
                control={control}
                render={({ field, fieldState: { invalid } }) => (
                    <Field data-invalid={invalid}>
                        <FieldLabel htmlFor="locality">Locality</FieldLabel>
                        <Input id="locality" data-testid="locality" {...field} />
                    </Field>
                )}
            />
        </>
    );
}

describe('SavedPresetSelect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        testState = null;
        testMethodsRef.current = null;
        for (const k of Object.keys(queryResults)) delete queryResults[k];

        mockRecordListSelect.mockImplementation(() => () => ({
            data: { items: [{ id: 'rec-1' }, { id: 'rec-2' }] },
        }));

        mockRecordsListQuery.mockReturnValue({
            isLoading: false,
            recordIds: ['rec-1', 'rec-2'],
        });

        mockRecordByIdQuery.mockImplementation(({ record_id }: { record_id: string | null }) =>
            queryResult(record_id),
        );

        mockUpdateRecord.mockReturnValue({
            unwrap: () => Promise.resolve({ record: { updated_at: '2024-01-01T00:00:01Z' } }),
        });
        mockCreateRecord.mockReturnValue({
            unwrap: () =>
                Promise.resolve({
                    id: 'rec-new',
                    ...RECORD_FIELDS,
                    updated_at: '2024-01-01T00:00:00Z',
                    country: null,
                }),
        });
        mockDeleteRecord.mockReturnValue({
            unwrap: () => Promise.resolve(undefined),
        });
    });

    it('applies null preset fields as empty', async () => {
        const RECORD_WITH_LOCALITY = {
            ...RECORD_1,
            locality: 'Old Locality',
        };

        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_WITH_LOCALITY);

        mockRecordListSelect.mockImplementation(() => () => ({
            data: { items: [RECORD_WITH_LOCALITY, RECORD_2] },
        }));

        const { getByTestId } = render(
            <TestHarness>
                <StateDisplay />
                <TestFields />
                <SavedPresetSelect type="location" publ_id={1} activeRecordId="rec-1" />
            </TestHarness>,
        );

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });

        expect((getByTestId('locality') as HTMLInputElement).value).toBe('Old Locality');

        expect(screen.queryByRole('button', { name: /заполнить/i })).not.toBeNull();

        act(() => {
            testMethodsRef.current!.setValue('locality', FORM_DEFAULT_VALUES.locality);
        });

        expect((getByTestId('locality') as HTMLInputElement).value).toBe('');
    });
});
