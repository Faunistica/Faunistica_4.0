import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import SubmitPublication from './SubmitPublication';

class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

const mockGetPublQuery = vi.hoisted(() => vi.fn());
const mockGetDraftsQuery = vi.hoisted(() => vi.fn());
const mockRecordByIdQuery = vi.hoisted(() => vi.fn());
const mockRecordsListQuery = vi.hoisted(() => vi.fn());

vi.mock('@/api/publAPI', () => ({
    useGetPublicationByIdQuery: mockGetPublQuery,
    useGetDraftRecordIdsQuery: mockGetDraftsQuery,
    useSubmitPublicationMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock('@/api/recordAPI', () => ({
    useRecordByIdQuery: mockRecordByIdQuery,
    useRecordsListQuery: mockRecordsListQuery,
}));

vi.mock('@/store/store', () => ({
    useAppDispatch: () => vi.fn(),
    store: { dispatch: vi.fn(), getState: () => ({ user: { user_id: 123 } }) },
}));

const PUBL = {
    publ_id: 1,
    author: 'Иванов И.И.',
    year: 2024,
    name: 'Птицы Урала',
    interactable: true,
    source_files: [],
};

function renderPage(publ = PUBL, draftsData?: { draft_record_ids: string[] }, draftsError = false) {
    mockGetPublQuery.mockReturnValue({ data: publ, isLoading: false });
    mockGetDraftsQuery.mockReturnValue({
        data: draftsData,
        isLoading: false,
        isError: draftsError,
    });
    mockRecordsListQuery.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false });

    return render(
        <MemoryRouter initialEntries={['/publication/1/submit']}>
            <Routes>
                <Route path="/publication/:id/submit" element={<SubmitPublication />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('SubmitPublication', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockRecordByIdQuery.mockImplementation(
            ({ record_id }: { record_id: string }, opts?: { selectFromResult?: Function }) => {
                const data = {
                    id: record_id,
                    type: 'check_ok' as const,
                    species: 'Test species',
                    locality: 'Test location',
                    publ_id: 1,
                    user_id: 123,
                };
                const result = { data, isLoading: false, isError: false };
                if (opts?.selectFromResult) {
                    return opts.selectFromResult(result);
                }
                return result;
            },
        );
    });

    it('shows loading screen while queries load', () => {
        mockGetPublQuery.mockReturnValue({ data: undefined, isLoading: true });
        mockGetDraftsQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });

        render(
            <MemoryRouter initialEntries={['/publication/1/submit']}>
                <Routes>
                    <Route path="/publication/:id/submit" element={<SubmitPublication />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole('status', { name: 'Loading' })).toBeDefined();
    });

    it('shows FormCard when no drafts exist', () => {
        renderPage(PUBL, { draft_record_ids: [] });

        expect(screen.getByText('Завершение обработки')).toBeDefined();
        expect(screen.queryByText('Завершение недоступно')).toBeNull();
    });

    it('shows DraftsBlock when drafts exist', () => {
        renderPage(PUBL, { draft_record_ids: ['draft-1', 'draft-2'] });

        expect(screen.getByText('Завершение недоступно')).toBeDefined();
        expect(screen.getByText(/2 черновых записей/)).toBeDefined();
    });

    it('shows single draft counter', () => {
        renderPage(PUBL, { draft_record_ids: ['draft-1'] });

        expect(screen.getByText(/1 черновая запись/)).toBeDefined();
    });

    it('shows links to each draft record', () => {
        renderPage(PUBL, { draft_record_ids: ['draft-1', 'draft-2'] });

        const links = screen.getAllByRole('link');
        const draftLinks = links.filter((l) => l.getAttribute('href')?.includes('draft-'));
        expect(draftLinks).toHaveLength(2);
    });

    it('shows error state when drafts query fails', () => {
        renderPage(PUBL, undefined, true);

        expect(screen.getByText('Ошибка загрузки черновиков')).toBeDefined();
        expect(screen.queryByText('Завершение обработки')).toBeNull();
        expect(screen.queryByText('Завершение недоступно')).toBeNull();
    });

    it('shows publication metadata in FormCard', () => {
        renderPage(PUBL, { draft_record_ids: [] });

        expect(screen.getByText(/Иванов И.И./)).toBeDefined();
        expect(screen.getByText(/2024/)).toBeDefined();
        expect(screen.getByText(/Птицы Урала/)).toBeDefined();
    });

    it('shows navigation link back to dashboard', () => {
        renderPage(PUBL, { draft_record_ids: [] });

        const dashboardLink = screen.getByText('На дашборд');
        expect(dashboardLink).toBeDefined();
        expect(dashboardLink.getAttribute('href')).toBe('/dashboard');
    });

    it('does not show loading after data loaded', () => {
        renderPage(PUBL, { draft_record_ids: [] });

        expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
    });
});
