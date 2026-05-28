import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormFilling from './FormFilling';

const mockRecordsListQuery = vi.hoisted(() => vi.fn());
const mockRecordByIdQuery = vi.hoisted(() => vi.fn());
const mockCreateRecord = vi.hoisted(() => vi.fn());
const mockEditRecord = vi.hoisted(() => vi.fn());
const mockSubmitRecord = vi.hoisted(() => vi.fn());
const mockDeleteRecord = vi.hoisted(() => vi.fn());
const mockDispatch = vi.hoisted(() => vi.fn());
const mockUpsertQueryData = vi.hoisted(() => vi.fn());
const mockUpdateQueryData = vi.hoisted(() => vi.fn());
const mockInvalidateTags = vi.hoisted(() => vi.fn());

vi.mock('react-router', () => ({
    useParams: () => ({ id: '1' }),
    useOutletContext: () => ({ isSidebarOpen: true, setIsSidebarOpen: vi.fn() }),
}));

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
    useEditRecordMutation: () => [mockEditRecord],
    useSubmitRecordMutation: () => [mockSubmitRecord],
    useDeleteRecordMutation: () => [mockDeleteRecord],
    recordAPI: {
        reducerPath: 'recordAPI',
        reducer: vi.fn(),
        middleware: vi.fn(),
        endpoints: {
            recordsList: {
                select: () => () => ({ data: { items: [{ id: 'rec-1' }, { id: 'rec-2' }] } }),
            },
        },
        util: {
            upsertQueryData: mockUpsertQueryData,
            updateQueryData: mockUpdateQueryData,
            invalidateTags: mockInvalidateTags,
        },
    },
}));

vi.mock('@/components/form/RecordFormContent', () => ({
    default: () => <div data-testid="record-form">RecordFormContent</div>,
}));

vi.mock('@/components/form/FormSidebar', () => ({
    default: () => <div data-testid="sidebar">FormSidebar</div>,
}));

vi.mock('@/components/ui/sidebar', () => ({
    SidebarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/LoadingScreen', () => ({
    default: () => <div data-testid="loading-screen">Loading...</div>,
}));

function renderFormFilling() {
    return render(<FormFilling />);
}

describe('FormFilling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading screen while data loads', () => {
        mockRecordsListQuery.mockReturnValue({ isLoading: true });
        mockRecordByIdQuery.mockReturnValue({ currentData: undefined });

        renderFormFilling();
        expect(screen.getByTestId('loading-screen')).toBeDefined();
    });

    it('renders form and sidebar when active record exists', async () => {
        mockRecordsListQuery.mockReturnValue({ isLoading: false });
        mockRecordByIdQuery.mockReturnValue({
            currentData: {
                id: 'rec-1',
                publ_id: 1,
                user_id: 123,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                country: 'RU',
                region: null,
                district: null,
                locality: null,
                latitude: null,
                longitude: null,
                verbatimcoordinates: null,
            },
        });

        renderFormFilling();

        expect(await screen.findByTestId('sidebar', {}, { timeout: 2000 })).toBeDefined();
        expect(await screen.findByTestId('record-form', {}, { timeout: 2000 })).toBeDefined();
    });
});
