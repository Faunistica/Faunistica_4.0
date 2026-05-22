/* oxlint-disable typescript/no-unsafe-type-assertion */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import FormFilling from './FormFilling';

const mockSave = vi.fn();
const mockGetValues = vi.fn();
const mockRecordsListQuery = vi.hoisted(() => vi.fn());

vi.mock('react-router', () => ({
    useParams: () => ({ id: '1' }),
    useOutletContext: () => ({ isSidebarOpen: true, setIsSidebarOpen: vi.fn() }),
}));

vi.mock('react-redux', () => ({
    useSelector: () => 123,
}));

vi.mock('@/store/store', () => ({
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@/hooks/useSaveRecord', () => ({
    useSaveRecord: () => ({
        save: mockSave,
        submit: vi.fn(),
        isSaving: false,
        nonFieldErrors: [],
    }),
}));

vi.mock('@/api/recordAPI', () => ({
    useRecordsListQuery: mockRecordsListQuery,
    useLazyRecordByIdQuery: () => [vi.fn()],
    useCreateRecordMutation: () => [vi.fn()],
    useDeleteRecordMutation: () => [vi.fn()],
    recordAPI: { util: { updateQueryData: vi.fn() } },
}));

vi.mock('react-hook-form', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        FormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useForm: () => ({
            reset: vi.fn(),
            getValues: mockGetValues,
            watch: vi.fn(() => ({ unsubscribe: vi.fn() })),
            formState: { errors: {} },
            control: {} as any,
            register: vi.fn(),
            setValue: vi.fn(),
            handleSubmit: vi.fn(),
        }),
    };
});

vi.mock('@hookform/resolvers/zod', () => ({
    zodResolver: () => ({}),
}));

vi.mock('sonner', () => ({
    toast: { error: vi.fn() },
}));

vi.mock('@/components/ui/sidebar', () => ({
    SidebarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/form/FormSidebar', () => ({
    default: ({ records, onSelectRecord }: any) => (
        <div data-testid="sidebar">
            {records.map((r: any) => (
                <button
                    key={r.id}
                    data-testid={`record-${r.id}`}
                    onClick={() => onSelectRecord(r.id)}
                >
                    {r.species}
                </button>
            ))}
        </div>
    ),
}));

vi.mock('@/components/form/ArticleSourceCard', () => ({ default: () => null }));
vi.mock('@/components/form/GeographyCard', () => ({ default: () => null }));
vi.mock('@/components/form/CollectionEventCard', () => ({ default: () => null }));
vi.mock('@/components/form/TaxonomyCard', () => ({ default: () => null }));
vi.mock('@/components/form/QuantitiesCard', () => ({ default: () => null }));
vi.mock('@/components/form/ServerErrorDisplay', () => ({ default: () => null }));
vi.mock('@/components/form/FormFooter', () => ({ default: () => null }));
vi.mock('@/components/LoadingScreen', () => ({ default: () => null }));

const mockRecords = [
    { id: '1', species: 'Canis', genus: 'Canis', family: 'Canidae', locality: 'Forest' },
    { id: '2', species: 'Felis', genus: 'Felis', family: 'Felidae', locality: 'Desert' },
];

function renderFormFilling() {
    mockRecordsListQuery.mockReturnValue({
        data: { items: mockRecords },
        isLoading: false,
    });
    return render(<FormFilling />);
}

describe('FormFilling switchToRecord', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('skips save when switching records and form has no unsaved changes', async () => {
        mockGetValues.mockReturnValue({ males: 3 });
        renderFormFilling();

        await waitFor(() => {
            screen.getByTestId('record-2');
        });

        await act(async () => {
            screen.getByTestId('record-2').click();
        });

        await waitFor(() => {
            expect(mockSave).not.toHaveBeenCalled();
        });
    });

    it('calls save when switching records and form has unsaved changes', async () => {
        let preClickCalls = 0;
        mockGetValues.mockImplementation(() => {
            preClickCalls++;
            return preClickCalls <= 2 ? { males: 3 } : { males: 99 };
        });
        renderFormFilling();

        await waitFor(() => {
            screen.getByTestId('record-2');
        });

        await act(async () => {
            screen.getByTestId('record-2').click();
        });

        await waitFor(() => {
            expect(mockSave).toHaveBeenCalledTimes(1);
        });
    });
});
