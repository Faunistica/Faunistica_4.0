import { capitalizeFirstLetter, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';
import { NavLink, useResolvedPath, useMatch } from 'react-router';
import { SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
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
import { useRecordByIdQuery } from '@/api/recordAPI';
import { computeInactiveStatus } from '@/lib/recordStatus';
import { RecordStatusIndicator } from '@/components/form/sidebar/RecordStatusIndicator';
import { useRecordForm } from '@/contexts/RecordFormProvider';
import { useCallback } from 'react';

export const SidebarRecordItem = ({ record_id }: { record_id: string }) => {
    const { isMobile, setOpenMobile } = useSidebar();
    const {
        actions: { onNavigate, deleteRecord },
        publId,
    } = useRecordForm();
    const resolved = useResolvedPath(`/publication/${publId}/${record_id}`);
    const match = useMatch({ path: resolved.pathname, end: true });
    const isActive = match !== null;

    const { status, recordName, recordLocation } = useRecordByIdQuery(
        { record_id },
        {
            selectFromResult: ({ data: record }) => ({
                status: record ? computeInactiveStatus(record) : 'empty',
                recordName: capitalizeFirstLetter(
                    record?.species || record?.genus || record?.family || 'Новая запись',
                ),
                recordLocation: record?.locality || record?.region || 'Нет данных о месте',
            }),
        },
    );

    const handleClick = useCallback(() => {
        onNavigate(record_id);
        if (isMobile) setOpenMobile(false);
    }, [onNavigate, record_id, isMobile, setOpenMobile]);

    const handleDelete = useCallback(() => {
        void deleteRecord(record_id);
    }, [deleteRecord, record_id]);

    return (
        <SidebarMenuItem>
            <NavLink
                to={`/publication/${publId}/${record_id}`}
                replace
                onClick={handleClick}
                className={cn(
                    'group/menu-button flex w-full cursor-pointer flex-col items-start gap-2 rounded-md px-3 py-2 text-left no-underline transition-all duration-200',
                    isActive ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50',
                )}
            >
                <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <RecordStatusIndicator status={status} />
                        <span className="truncate text-xs/tight font-bold text-slate-700">
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
                            <span className="truncate pl-1">{recordLocation}</span>
                        </>
                    )}
                </div>
            </NavLink>
        </SidebarMenuItem>
    );
};
