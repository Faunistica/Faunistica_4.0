import { type FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, X, FileSpreadsheet } from 'lucide-react';
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
import ExcelUploadModal from '@/components/form/inputs/ExcelUploadModal';
import { useRecordForm } from '@/contexts/useRecordForm';
import { SidebarRecordItem } from './FormSidebarItem';
import { FormSidebarFooter } from './FormSidebarFooter';

const FormSidebar: FC = () => {
    const {
        state: { recordIds },
        actions: { create },
        publ_id,
    } = useRecordForm();
    const { setOpenMobile } = useSidebar();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

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
                                    <SidebarRecordItem key={id} record_id={id} />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="border-t border-slate-100 p-4">
                    <FormSidebarFooter />
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
