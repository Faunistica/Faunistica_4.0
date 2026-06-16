import { type FC, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, X, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from '@/components/ui/sidebar';
import { useTranslation } from 'react-i18next';
import ExcelUploadModal from '@/components/form/inputs/ExcelUploadModal';
import { useRecordForm } from '@/hooks/useRecordForm';
import { useRecordIDs } from '@/hooks/useRecordIDs';
import { SidebarRecordItem } from './FormSidebarItem';
import { Link } from 'react-router';

const FormSidebar: FC = () => {
    const { t } = useTranslation();
    const {
        state: { publ_id, activeRecordId },
        actions: { create, onNavigate, deleteRecord },
    } = useRecordForm();
    const recordIds = useRecordIDs(publ_id);
    const { setOpenMobile, isMobile, openMobile } = useSidebar();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        const scroll = () => {
            if (!scrollRef.current) return;
            if (activeRecordId) {
                const el = scrollRef.current.querySelector('a[aria-current="page"]');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                scrollRef.current.scrollTop = 0;
            }
        };

        if (isMobile && openMobile) {
            const timer = setTimeout(scroll, 250);
            return () => clearTimeout(timer);
        }

        if (!isMobile) {
            scroll();
        }
        return () => {};
    }, [activeRecordId, recordIds, isMobile, openMobile]);

    return (
        <>
            <Sidebar variant="sidebar" className="border-r border-slate-200">
                <SidebarHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        {isMobile ? (
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-white">
                                    <FileText className="size-4" />
                                </div>
                                <div>
                                    <div className="text-sm/tight font-bold text-slate-900">
                                        {t('form.sidebarSection.manager')}
                                    </div>
                                    <div className="text-[10px] leading-tight font-medium text-slate-500">
                                        {t('form.sidebarSection.dataRecords')}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <span className="h-12" />
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-400 hover:text-slate-600 md:hidden"
                            onClick={() => setOpenMobile(false)}
                                                            aria-label={t('form.sidebarSection.closePanel')}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                    <div className="space-y-2 pt-3">
                        <Button
                            type="button"
                            onClick={create}
                            className="flex h-fit w-full items-center gap-2 bg-slate-900 py-2 font-semibold text-white shadow-sm hover:bg-slate-800"
                            size="sm"
                        >
                            <Plus className="size-4" />
                            <span>{t('form.sidebarSection.addRecord')}</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsUploadOpen(true)}
                            className="flex h-fit w-full items-center gap-2 border-emerald-200 py-2 font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-800"
                            size="sm"
                        >
                            <FileSpreadsheet className="size-4" />
                            {t('form.sidebarSection.excelWork')}
                        </Button>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="overflow-y-hidden p-0">
                        <SidebarGroupLabel className="rounded-none border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase shadow-xs">
                            <span className="py-1 pl-2">{t('form.sidebarSection.recordList')}</span>
                        </SidebarGroupLabel>
                        <SidebarGroupContent
                            ref={scrollRef}
                            className="no-scrollbar overflow-y-scroll p-2"
                        >
                            <SidebarMenu className="gap-1.5 px-2 pt-1">
                                {recordIds.map((id) => (
                                    <SidebarRecordItem
                                        key={id}
                                        publ_id={publ_id}
                                        record_id={id}
                                        isActive={id === activeRecordId}
                                        onNavigate={onNavigate}
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
                        <Link to={`/publication/${publ_id}/submit`}>
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            {t('form.sidebarSection.finishProcessing')}
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
