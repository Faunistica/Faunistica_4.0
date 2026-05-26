import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import FormFilling from './FormFilling';

const mockRecordsManager = vi.hoisted(() => vi.fn());

vi.mock('react-router', () => ({
    useParams: () => ({ id: '1' }),
    useOutletContext: () => ({ isSidebarOpen: true, setIsSidebarOpen: vi.fn() }),
}));

vi.mock('react-redux', () => ({
    useSelector: () => 123,
}));

vi.mock('@/hooks/useRecordsManager', () => ({
    useRecordsManager: mockRecordsManager,
}));

vi.mock('@/components/form/RecordFormContent', () => ({
    default: (props: any) => (
        <div data-testid="record-form" data-active-record-id={props.activeRecord.id}>
            RecordFormContent
        </div>
    ),
}));

vi.mock('@/components/form/FormSidebar', () => ({
    default: ({ onSelectRecord }: any) => (
        <div data-testid="sidebar">
            <button data-testid="record-1" onClick={() => onSelectRecord('1')}>
                Canis
            </button>
            <button data-testid="record-2" onClick={() => onSelectRecord('2')}>
                Felis
            </button>
        </div>
    ),
}));

vi.mock('@/components/ui/sidebar', () => ({
    SidebarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/LoadingScreen', () => ({
    default: () => <div data-testid="loading-screen">Loading...</div>,
}));

const mockRecords = [
    { id: '1', species: 'Canis', genus: 'Canis', family: 'Canidae', locality: 'Forest' },
    { id: '2', species: 'Felis', genus: 'Felis', family: 'Felidae', locality: 'Desert' },
];

function renderFormFilling() {
    return render(<FormFilling />);
}

describe('FormFilling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading screen while data loads', () => {
        mockRecordsManager.mockReturnValue({
            records: [],
            activeRecord: null,
            isLoading: true,
            recordMethods: { create: vi.fn(), switchTo: vi.fn(), delete: vi.fn() },
            registerSave: vi.fn(),
        });

        renderFormFilling();
        expect(screen.getByTestId('loading-screen')).toBeDefined();
    });

    it('shows empty state when no records exist', () => {
        mockRecordsManager.mockReturnValue({
            records: [],
            activeRecord: null,
            isLoading: false,
            recordMethods: { create: vi.fn(), switchTo: vi.fn(), delete: vi.fn() },
            registerSave: vi.fn(),
        });

        renderFormFilling();
        expect(screen.getByText('Нет записей')).toBeDefined();
        expect(screen.getByText('Создать запись')).toBeDefined();
    });

    it('renders form and sidebar when active record exists', () => {
        mockRecordsManager.mockReturnValue({
            records: mockRecords,
            activeRecord: mockRecords[0],
            isLoading: false,
            recordMethods: { create: vi.fn(), switchTo: vi.fn(), delete: vi.fn() },
            registerSave: vi.fn(),
        });

        renderFormFilling();

        expect(screen.getByTestId('record-form')).toBeDefined();
        expect(screen.getByTestId('sidebar')).toBeDefined();
        expect(screen.getByTestId('record-form').getAttribute('data-active-record-id')).toBe('1');
    });

    it('calls create when create button is clicked in empty state', async () => {
        const mockCreate = vi.fn();
        mockRecordsManager.mockReturnValue({
            records: [],
            activeRecord: null,
            isLoading: false,
            recordMethods: { create: mockCreate, switchTo: vi.fn(), delete: vi.fn() },
            registerSave: vi.fn(),
        });

        renderFormFilling();

        await act(async () => {
            screen.getByText('Создать запись').click();
        });

        expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('calls switchTo when sidebar item is clicked', async () => {
        const mockSwitchTo = vi.fn();
        mockRecordsManager.mockReturnValue({
            records: mockRecords,
            activeRecord: mockRecords[0],
            isLoading: false,
            recordMethods: { create: vi.fn(), switchTo: mockSwitchTo, delete: vi.fn() },
            registerSave: vi.fn(),
        });

        renderFormFilling();

        await act(async () => {
            screen.getByTestId('record-2').click();
        });

        expect(mockSwitchTo).toHaveBeenCalledWith('2');
    });
});
