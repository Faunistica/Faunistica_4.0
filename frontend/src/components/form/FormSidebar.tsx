import { type FC, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, FileText, MapPin, X } from 'lucide-react';
import { Link } from 'react-router';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from '@/components/ui/sidebar';
import type { RecordFull } from '@/types/api.dto';
import type { RecordStatus } from '@/hooks/useRecordStatus';
import { RecordStatusIndicator } from '@/components/sidebar/RecordStatusIndicator';

interface SidebarProps {
    records: RecordFull[];
    activeRecordId: string | null;
    recordStatuses: Record<string, RecordStatus>;
    onSelectRecord: (id: string) => void;
    onCreateRecord: () => void;
}

const SidebarRecordItem = memo(
    ({
        record,
        isActive,
        onSelect,
        status,
    }: {
        record: RecordFull;
        isActive: boolean;
        onSelect: () => void;
        status: RecordStatus;
    }) => {
        const recordName = record.species || record.genus || record.family || 'Новая запись';

        return (
            <SidebarMenuItem>
                <div
                    role="button"
                    tabIndex={0}
                    data-active={isActive}
                    onClick={onSelect}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect();
                        }
                    }}
                    className={`group/menu-button flex w-full cursor-pointer flex-col items-start gap-2 rounded-md px-3 py-3 text-left transition-all duration-200 ${
                        isActive
                            ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200'
                            : 'hover:bg-slate-50'
                    }`}
                >
                    <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <RecordStatusIndicator status={status} />
                            <span
                                className={`truncate text-xs leading-tight font-bold ${
                                    isActive ? 'text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {recordName}
                            </span>
                        </div>
                    </div>

                    <div className="flex w-full items-center gap-1.5 text-[10px] text-slate-500">
                        {isActive ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                                </span>
                                <span className="font-semibold text-blue-600">Редактируется</span>
                            </>
                        ) : (
                            <>
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                    {record.locality || record.region || 'Нет данных о месте'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </SidebarMenuItem>
        );
    },
);
SidebarRecordItem.displayName = 'SidebarRecordItem';

const FormSidebar: FC<SidebarProps> = ({
    records,
    activeRecordId,
    recordStatuses,
    onSelectRecord,
    onCreateRecord,
}) => {
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <Sidebar variant="sidebar" className="border-r border-slate-200">
            <SidebarHeader className="border-b border-slate-100 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-sm leading-tight font-bold text-slate-900">
                                Менеджер
                            </div>
                            <div className="text-[10px] leading-tight font-medium text-slate-500">
                                Записи данных
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600 md:hidden"
                        onClick={() => setOpenMobile(false)}
                        aria-label="Закрыть панель"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <div className="space-y-2 p-4 pb-0">
                    <Button
                        type="button"
                        onClick={onCreateRecord}
                        className="w-full gap-2 bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800"
                        size="sm"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить запись
                    </Button>
                </div>

                <SidebarGroup className="mt-2">
                    <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Список записей
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5 px-2">
                            {records.map((record) => (
                                <SidebarRecordItem
                                    key={record.id}
                                    record={record}
                                    isActive={record.id === activeRecordId}
                                    status={recordStatuses[record.id] ?? 'draft'}
                                    onSelect={() => {
                                        onSelectRecord(record.id);
                                        if (isMobile) setOpenMobile(false);
                                    }}
                                />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-100 p-4">
                <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2 font-medium shadow-sm"
                >
                    <Link to="/dashboard">
                        <LogOut className="h-4 w-4 text-slate-500" />
                        Вернуться назад
                    </Link>
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
};

export default FormSidebar;
