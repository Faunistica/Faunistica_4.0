import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor, renderHook } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router';
import { useForm, FormProvider, Controller, useFormContext } from 'react-hook-form';
import { RecordFormProvider } from '@/contexts/RecordFormProvider';
import type { RecordFormActions } from '@/contexts/useRecordFormActions';
import { FORM_DEFAULT_VALUES, type RecordForm } from '@/types/forms';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
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
let testActions: RecordFormActions | null = null;
const testMethodsRef: { current: ReturnType<typeof useForm<RecordForm>> | null } = {
    current: null,
};

function StateDisplay() {
    const { state, actions } = useRecordForm();
    testState = state;
    testActions = actions;
    return <div data-testid="state-display" />;
}

function SelectorDisplay() {
    const { state: phase } = useRecordForm((ctx) => ctx.state.status.phase);
    return <div data-testid="phase">{phase}</div>;
}

let testNavigate: ((path: string) => void) | null = null;
function NavCapture() {
    testNavigate = useNavigate();
    return null;
}

function TestHarness({
    children,
    autoSaveDelay,
}: {
    children: React.ReactNode;
    autoSaveDelay?: number;
}) {
    const methods = useForm<RecordForm>({ defaultValues: FORM_DEFAULT_VALUES });
    testMethodsRef.current = methods;
    return (
        <MemoryRouter initialEntries={['/publication/1/rec-1']}>
            <Routes>
                <Route
                    path="/publication/:publ_id/:record"
                    element={
                        <FormProvider {...methods}>
                            <RecordFormProvider publ_id={1} autoSaveDelay={autoSaveDelay}>
                                <FormProvider {...methods}>
                                    <NavCapture />
                                    {children}
                                </FormProvider>
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
            <Controller
                name="accepted_name"
                control={control}
                render={({ field, fieldState: { invalid } }) => (
                    <Field data-invalid={invalid}>
                        <FieldLabel htmlFor="accepted_name">Accepted name</FieldLabel>
                        <Input
                            id="accepted_name"
                            data-testid="accepted_name"
                            {...field}
                            value={field.value?.toString()}
                        />
                    </Field>
                )}
            />
            <Controller
                name="location_remarks"
                control={control}
                render={({ field, fieldState: { invalid } }) => (
                    <Field data-invalid={invalid}>
                        <FieldLabel htmlFor="location_remarks">Location remarks</FieldLabel>
                        <Textarea
                            id="location_remarks"
                            data-testid="location_remarks"
                            {...field}
                            value={field.value ?? ''}
                        />
                    </Field>
                )}
            />
            <Controller
                name="is_interval"
                control={control}
                render={({ field }) => (
                    <Field>
                        <Checkbox
                            id="is_interval"
                            data-testid="is_interval"
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                        />
                        <FieldLabel htmlFor="is_interval">Is interval</FieldLabel>
                    </Field>
                )}
            />
        </>
    );
}

describe('RecordFormProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        testState = null;
        testActions = null;
        testMethodsRef.current = null;
        // Reset query result cache
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

    it('shows loading state while list is loading', () => {
        mockRecordsListQuery.mockReturnValue({
            isLoading: true,
            recordIds: [],
        });

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        expect(testState!.isInitialLoading).toBe(true);
    });

    it('auto-selects first record from list', () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        expect(testState!.activeRecordId).toBe('rec-1');
    });

    it('syncs form with record data', () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        expect(testMethodsRef.current!.getValues('country')).toBe('RU');
    });

    it('is not loading after data arrives', () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        expect(testState!.isInitialLoading).toBe(false);
    });

    it('has idle status after sync', () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        expect(testState!.status.phase).toBe('idle');
    });

    it('onNavigate + NavLink changes active record and loads new data', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);
        setQueryResult('rec-2', RECORD_2);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );
        expect(testState!.activeRecordId).toBe('rec-1');

        act(() => {
            testActions!.onNavigate('rec-2');
        });

        expect(testState!.status.phase).toBe('syncing');

        act(() => {
            testNavigate!('/publication/1/rec-2');
        });

        expect(testState!.activeRecordId).toBe('rec-2');

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });
        expect(testMethodsRef.current!.getValues('country')).toBe('DE');
    });

    it('onNavigate + NavLink back-and-forth does not mix up data', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);
        setQueryResult('rec-2', RECORD_2);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );
        expect(testState!.activeRecordId).toBe('rec-1');
        expect(testMethodsRef.current!.getValues('country')).toBe('RU');

        // Switch to rec-2
        act(() => {
            testActions!.onNavigate('rec-2');
        });
        act(() => {
            testNavigate!('/publication/1/rec-2');
        });

        expect(testState!.activeRecordId).toBe('rec-2');

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });
        expect(testMethodsRef.current!.getValues('country')).toBe('DE');

        // Switch back to rec-1
        act(() => {
            testActions!.onNavigate('rec-1');
        });
        act(() => {
            testNavigate!('/publication/1/rec-1');
        });

        expect(testState!.activeRecordId).toBe('rec-1');

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });
        expect(testMethodsRef.current!.getValues('country')).toBe('RU');

        // Switch to rec-2 again
        act(() => {
            testActions!.onNavigate('rec-2');
        });
        act(() => {
            testNavigate!('/publication/1/rec-2');
        });

        expect(testState!.activeRecordId).toBe('rec-2');

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });
        expect(testMethodsRef.current!.getValues('country')).toBe('DE');
    });

    it('onNavigate to same record is no-op', () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );
        testMethodsRef.current!.setValue('country', 'DE');

        testActions!.onNavigate('rec-1');

        expect(testState!.activeRecordId).toBe('rec-1');
        expect(testState!.status.phase).toBe('idle');
        expect(mockUpdateRecord).not.toHaveBeenCalled();
    });

    it('save calls editRecord', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        await act(() => testActions!.save());

        expect(mockUpdateRecord).toHaveBeenCalledWith(
            expect.objectContaining({ submit: false, record_id: 'rec-1' }),
        );
    });

    it('save updates lastSavedTime on success', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        await act(() => testActions!.save());

        expect(testState!.lastSavedTime).toBeInstanceOf(Date);
        expect(testState!.status.phase).toBe('idle');
    });

    it('submit calls editRecord then submitRecord', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        await act(() => testActions!.submit());

        expect(mockUpdateRecord).toHaveBeenCalledWith(
            expect.objectContaining({ submit: true, record_id: 'rec-1' }),
        );
        expect(testState!.status.phase).toBe('idle');
    });

    it('create switches to new record', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        await act(() => testActions!.create());

        expect(mockCreateRecord).toHaveBeenCalledWith(expect.objectContaining({ publ_id: 1 }));
        expect(testState!.activeRecordId).toBe('rec-new');

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });
    });

    it('delete removes record, updates cache, and switches to next', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );
        expect(testState!.activeRecordId).toBe('rec-1');

        await act(() => testActions!.deleteRecord('rec-1'));

        expect(mockDeleteRecord).toHaveBeenCalledWith(
            expect.objectContaining({ record_id: 'rec-1', publ_id: 1 }),
        );
        expect(testState!.activeRecordId).toBe('rec-2');
    });

    it('returns to idle on save error', async () => {
        mockUpdateRecord.mockReturnValue({
            unwrap: () => Promise.reject(new Error('save failed')),
        });
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        await act(() => testActions!.save());

        expect(testState!.status.phase).toBe('idle');
    });

    it('returns to idle on submit error', async () => {
        mockUpdateRecord.mockReturnValue({
            unwrap: () => Promise.reject(new Error('submit failed')),
        });
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        await act(() => testActions!.submit());

        expect(testState!.status.phase).toBe('idle');
    });

    it('returns to idle on create error', async () => {
        mockCreateRecord.mockReturnValue({
            unwrap: () => Promise.reject(new Error('create failed')),
        });
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);

        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );

        await act(() => testActions!.create());

        expect(testState!.status.phase).toBe('idle');
    });

    it('RHF watch fires on setValue', async () => {
        const callback = vi.fn();
        const { result } = renderHook(() =>
            useForm<RecordForm>({ defaultValues: { country: 'RU' } }),
        );
        result.current.watch(callback);
        result.current.setValue('country', 'US');
        await new Promise((r) => setTimeout(r, 10));
        expect(callback).toHaveBeenCalled();
    });

    it('RHF watch fires after reset + setValue', async () => {
        const { result } = renderHook(() =>
            useForm<RecordForm>({ defaultValues: { country: 'RU' } }),
        );
        const callback = vi.fn();
        result.current.watch(callback);
        await act(async () => {
            result.current.reset({ country: 'DE' });
        });
        await new Promise((r) => setTimeout(r, 10));
        await act(async () => {
            result.current.setValue('country', 'US');
        });
        await new Promise((r) => setTimeout(r, 10));
        expect(callback).toHaveBeenCalled();
    });

    describe('computed booleans', () => {
        it('hasRecords is true when recordIds has items', () => {
            setQueryResult(null, undefined);
            setQueryResult('rec-1', RECORD_1);
            render(
                <TestHarness>
                    <StateDisplay />
                </TestHarness>,
            );
            expect(testState!.hasRecords).toBe(true);
        });

        it('hasRecords is false when recordIds is empty', () => {
            mockRecordsListQuery.mockReturnValue({ isLoading: false, recordIds: [] });
            setQueryResult(null, undefined);
            render(
                <TestHarness>
                    <StateDisplay />
                </TestHarness>,
            );
            expect(testState!.hasRecords).toBe(false);
        });

        it('isSaving is false after initial sync', () => {
            setQueryResult(null, undefined);
            setQueryResult('rec-1', RECORD_1);
            render(
                <TestHarness>
                    <StateDisplay />
                </TestHarness>,
            );
            expect(testState!.isSaving).toBe(false);
        });

        it('isBusy is false after initial sync', () => {
            setQueryResult(null, undefined);
            setQueryResult('rec-1', RECORD_1);
            render(
                <TestHarness>
                    <StateDisplay />
                </TestHarness>,
            );
            expect(testState!.isBusy).toBe(false);
        });
    });

    it('globalErrors contains server errors after sync', () => {
        const recWithErrors = {
            ...RECORD_1,
            errors: [{ field: null, message: 'Global error message' }],
        };
        setQueryResult(null, undefined);
        setQueryResult('rec-1', recWithErrors);
        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );
        expect(testState!.globalErrors).toContain('Global error message');
    });

    it('globalErrors is empty when record has no errors', () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);
        render(
            <TestHarness>
                <StateDisplay />
            </TestHarness>,
        );
        expect(testState!.globalErrors).toEqual([]);
    });

    it('selector variant returns selected value', async () => {
        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_1);
        const { getByTestId } = render(
            <TestHarness>
                <SelectorDisplay />
            </TestHarness>,
        );
        await waitFor(() => {
            expect(getByTestId('phase').textContent).toBe('idle');
        });
    });

    describe('auto-save', () => {
        it('auto-saves on form change after debounce delay', async () => {
            setQueryResult(null, undefined);
            setQueryResult('rec-1', RECORD_1);

            render(
                <TestHarness autoSaveDelay={1}>
                    <StateDisplay />
                </TestHarness>,
            );
            expect(testState!.activeRecordId).toBe('rec-1');

            await act(async () => {
                testMethodsRef.current!.setValue('country', 'US');
            });

            await waitFor(() => {
                expect(mockUpdateRecord).toHaveBeenCalledWith(
                    expect.objectContaining({ submit: false, record_id: 'rec-1' }),
                );
            });
            expect(testState!.status.phase).toBe('idle');
        });

        it('manual save cancels pending auto-save', async () => {
            setQueryResult(null, undefined);
            setQueryResult('rec-1', RECORD_1);

            render(
                <TestHarness autoSaveDelay={100}>
                    <StateDisplay />
                </TestHarness>,
            );
            expect(testState!.activeRecordId).toBe('rec-1');

            testMethodsRef.current!.setValue('country', 'US');

            await act(async () => {
                await testActions!.save();
            });

            await new Promise((r) => setTimeout(r, 200));

            expect(mockUpdateRecord).toHaveBeenCalledTimes(1);
            expect(testState!.status.phase).toBe('idle');
        });

        it('auto-save fires once with latest values after rapid changes', async () => {
            setQueryResult(null, undefined);
            setQueryResult('rec-1', RECORD_1);

            render(
                <TestHarness autoSaveDelay={50}>
                    <StateDisplay />
                </TestHarness>,
            );
            expect(testState!.activeRecordId).toBe('rec-1');

            await act(async () => {
                testMethodsRef.current!.setValue('country', 'US');
                testMethodsRef.current!.setValue('locality', 'Moscow');
                testMethodsRef.current!.setValue('country', 'DE');
            });

            await waitFor(() => {
                expect(mockUpdateRecord).toHaveBeenCalledTimes(1);
            });
            expect(mockUpdateRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    submit: false,
                    record_id: 'rec-1',
                    data: expect.objectContaining({ country: 'DE', locality: 'Moscow' }),
                }),
            );
            expect(testState!.status.phase).toBe('idle');
        });
    });

    it('onNavigate + NavLink to null record resets input display to empty', async () => {
        const RECORD_WITH_VALUES = {
            ...RECORD_1,
            locality: 'Moscow Valley',
            accepted_name: 'Canis lupus',
            location_remarks: 'Some notes',
            is_interval: true,
        };
        const RECORD_WITH_NULLS = {
            ...RECORD_2,
            locality: null,
            accepted_name: null,
            location_remarks: null,
            is_interval: null,
        };

        setQueryResult(null, undefined);
        setQueryResult('rec-1', RECORD_WITH_VALUES);
        setQueryResult('rec-2', RECORD_WITH_NULLS);

        const { getByTestId } = render(
            <TestHarness>
                <StateDisplay />
                <TestFields />
            </TestHarness>,
        );

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });

        expect((getByTestId('locality') as HTMLInputElement).value).toBe('Moscow Valley');
        expect((getByTestId('accepted_name') as HTMLInputElement).value).toBe('Canis lupus');
        expect((getByTestId('location_remarks') as HTMLTextAreaElement).value).toBe('Some notes');
        expect(getByTestId('is_interval').getAttribute('aria-checked')).toBe('true');

        act(() => {
            testActions!.onNavigate('rec-2');
        });
        act(() => {
            testNavigate!('/publication/1/rec-2');
        });

        await waitFor(() => {
            expect(testState!.status.phase).toBe('idle');
        });

        expect((getByTestId('locality') as HTMLInputElement).value).toBe('');
        expect((getByTestId('accepted_name') as HTMLInputElement).value).toBe('');
        expect((getByTestId('location_remarks') as HTMLTextAreaElement).value).toBe('');
        expect(getByTestId('is_interval').getAttribute('aria-checked')).toBe('false');
    });
});
