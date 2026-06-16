import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';
import { NavLink } from 'react-router';
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
import { RecordStatusIndicator } from '@/components/form/sidebar/RecordStatusIndicator';
import { selectRecordSummary } from '@/lib/recordSelectors';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const SidebarRecordItem = ({
    publ_id,
    record_id,
    isActive,
    onNavigate,
    deleteRecord,
}: {
    publ_id: number;
    record_id: string;
    isActive: boolean;
    onNavigate: (targetID: string) => void;
    deleteRecord: (id: string) => Promise<void>;
}) => {
    const { t } = useTranslation();
    const { isMobile, setOpenMobile } = useSidebar();

    const { status, recordName, recordLocation } = useRecordByIdQuery(
        { record_id },
        { selectFromResult: selectRecordSummary },
    );

    const handleClick = useCallback(() => {
        onNavigate(record_id);
        if (isMobile) setOpenMobile(false);
    }, [onNavigate, record_id, isMobile, setOpenMobile]);

    const handleDelete = useCallback(async () => {
        await deleteRecord(record_id);
    }, [deleteRecord, record_id]);

    return (
        <SidebarMenuItem>
            <NavLink
                to={`/publication/${publ_id}/${record_id}`}
                replace
                onClick={handleClick}
                className={cn(
                    'group/menu-button flex h-18 w-full cursor-pointer flex-col items-start justify-center gap-2 rounded-md px-3 py-2 text-left no-underline transition-all duration-200',
                    isActive ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50',
                )}
            >
                <div className="flex min-w-0 items-center gap-2 pb-1">
                    <RecordStatusIndicator status={status} />
                    <span className="truncate text-xs/tight font-bold text-slate-700">
                        {recordName}
                    </span>
                </div>

                <div className="flex w-full items-center gap-1.5 pl-0.5 text-[10px] text-slate-500">
                    {isActive ? (
                        <>
                            <span className="relative flex h-2 pl-px">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
                            </span>
                            <span className="pl-1 font-semibold text-blue-600">
                                {t('form.sidebarSection.editing')}
                            </span>
                        </>
                    ) : (
                        <>
                            <MapPin className="size-2.5 shrink-0" />
                            <span className="truncate pl-1">{recordLocation}</span>
                        </>
                    )}
                </div>
            </NavLink>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2.5 right-1.5 z-10 size-6 shrink-0 rounded-md text-slate-400 opacity-100 transition-opacity group-hover/menu-item:opacity-100 hover:bg-red-100 hover:text-red-600 aria-expanded:opacity-100 md:opacity-0"
                        aria-label={t('form.sidebarSection.deleteRecordAria')}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('form.sidebarSection.deleteConfirmTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('form.sidebarSection.deleteConfirmDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={async () => {
                                await handleDelete();
                            }}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarMenuItem>
    );
};
