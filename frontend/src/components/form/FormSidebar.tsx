import { type FC, useState, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { capitalizeFirstLetter, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, FileText, MapPin, X, FileSpreadsheet, Trash2 } from 'lucide-react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { recordAPI, useRecordByIdQuery } from '@/api/recordAPI';
import { computeInactiveStatus } from '@/lib/recordStatus';
import { useAppSelector } from '@/store/store';
import { RecordStatusIndicator } from '@/components/sidebar/RecordStatusIndicator';
import ExcelUploadModal from '@/components/form/ExcelUploadModal';
import { useRecordFormContext } from '@/contexts/RecordFormProvider';

const SidebarRecordItem = ({
    recordId,
    isActive,
    onSelectRecord,
    deleteRecord,
}: {
    recordId: string;
    isActive: boolean;
    onSelectRecord: (id: string) => void;
    deleteRecord: (id: string) => void;
}) => {
    // Only use blocking fields?
    const { currentData: record } = useRecordByIdQuery({ record_id: recordId });
    const { isMobile, setOpenMobile } = useSidebar();
    const status = record ? computeInactiveStatus(record) : 'empty';
    const recordName = capitalizeFirstLetter(
        record?.species || record?.genus || record?.family || 'Новая запись',
    );

    const handleSelect = useCallback(() => {
        onSelectRecord(recordId);
        if (isMobile) setOpenMobile(false);
    }, [onSelectRecord, recordId, isMobile, setOpenMobile]);

    const handleDelete = useCallback(() => {
        deleteRecord(recordId);
    }, [deleteRecord, recordId]);

    return (
        <SidebarMenuItem>
            <div
                role="button"
                tabIndex={0}
                data-active={isActive}
                onClick={handleSelect}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect();
                    }
                }}
                className={cn(
                    'group/menu-button flex w-full cursor-pointer flex-col items-start gap-2 rounded-md px-3 py-2 text-left transition-all duration-200',
                    isActive ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50',
                )}
            >
                <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <RecordStatusIndicator status={status} />
                        <span
                            className={cn(
                                'truncate text-xs/tight font-bold',
                                isActive ? 'text-slate-900' : 'text-slate-700',
                            )}
                        >
                            {recordName}
                        </span>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0 rounded-md text-slate-400 opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 data-[active=true]:opacity-100 md:opacity-0 md:group-hover/menu-button:opacity-100 md:data-[active=true]:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Удалить запись"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Это действие нельзя отменить. Запись будет безвозвратно удалена.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                    Отмена
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    variant="destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                >
                                    Удалить
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div className="flex w-full items-center gap-1.5 pl-0.5 text-[10px] text-slate-500">
                    {isActive ? (
                        <>
                            <span className="relative flex h-2 pl-px">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
                            </span>
                            <span className="pl-1 font-semibold text-blue-600">Редактируется</span>
                        </>
                    ) : (
                        <>
                            <MapPin className="size-2.5 shrink-0" />
                            <span className="truncate pl-1">
                                {record?.locality || record?.region || 'Нет данных о месте'}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </SidebarMenuItem>
    );
};

const FormSidebar: FC = () => {
    const { state, actions, publ_id } = useRecordFormContext();
    const { activeRecordId } = state;
    const { switchTo, create, deleteRecord } = actions;
    const { setOpenMobile } = useSidebar();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const recordIds = useAppSelector((st) => {
        const result = recordAPI.endpoints.recordsList.select({ publ_id })(st);
        const data = 'data' in result ? result.data : undefined;
        return data?.items?.map((r) => r.id) ?? [];
    }, shallowEqual);

    return (
        <>
            <Sidebar variant="sidebar" className="border-r border-slate-200">
                <SidebarHeader className="border-b border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-white">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <div className="text-sm/tight font-bold text-slate-900">
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
                            className="size-8 text-slate-400 hover:text-slate-600 md:hidden"
                            onClick={() => setOpenMobile(false)}
                            aria-label="Закрыть панель"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <div className="space-y-2 p-4 pb-0">
                        <Button
                            type="button"
                            onClick={create}
                            className="flex h-fit w-full items-center gap-2 bg-slate-900 py-2 font-semibold text-white shadow-sm hover:bg-slate-800"
                            size="sm"
                        >
                            <Plus className="size-4" />
                            <span>Добавить запись</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsUploadOpen(true)}
                            className="flex h-fit w-full items-center gap-2 border-emerald-200 py-2 font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-800"
                            size="sm"
                        >
                            <FileSpreadsheet className="size-4" />
                            Работа с Excel
                        </Button>
                    </div>

                    <SidebarGroup className="mt-2">
                        <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            Список записей
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1.5 px-2">
                                {recordIds.map((id) => (
                                    <SidebarRecordItem
                                        key={id}
                                        recordId={id}
                                        isActive={id === activeRecordId}
                                        onSelectRecord={switchTo}
                                        deleteRecord={deleteRecord}
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
                            <LogOut className="size-4 text-slate-500" />
                            Вернуться назад
                        </Link>
                    </Button>
                </SidebarFooter>
            </Sidebar>

            <ExcelUploadModal
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                publ_id={publ_id}
            />
        </>
    );
};

export default FormSidebar;
