import { type FC, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { useRecordsManager } from '@/hooks/useRecordsManager';
import type { RecordStatus } from '@/lib/recordStatus';
import RecordFormContent from '@/components/form/RecordFormContent';
import FormSidebar from '@/components/form/FormSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const FormFilling: FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<OutletContextType>();
    const { id } = useParams<{ id: string }>();
    const publ_id = Number(id);
    const user_id = useSelector((state: RootState) => state.user.user_id);

    const { records, activeRecord, isLoading, recordMethods, registerSave } = useRecordsManager(
        publ_id,
        user_id!,
    );

    const [activeStatus, setActiveStatus] = useState<RecordStatus | null>(null);
    const activeRecordId = activeRecord?.id ?? null;

    if (isLoading) return <LoadingScreen />;

    return (
        <SidebarProvider
            open={true}
            openMobile={isSidebarOpen}
            onOpenMobileChange={setIsSidebarOpen}
            className="flex-1"
        >
            <FormSidebar
                records={records}
                activeRecordId={activeRecordId}
                activeStatus={activeStatus}
                onSelectRecord={recordMethods.switchTo}
                onCreateRecord={recordMethods.create}
            />
            <main className="relative flex w-full min-w-0 flex-1 flex-col">
                {activeRecord ? (
                    <RecordFormContent
                        publ_id={publ_id}
                        activeRecord={activeRecord}
                        onRegisterSave={registerSave}
                        onStatusChange={setActiveStatus}
                        onDelete={recordMethods.delete}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-6 py-24">
                        <p className="text-lg text-slate-500">Нет записей</p>
                        <Button onClick={recordMethods.create} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Создать запись
                        </Button>
                    </div>
                )}
            </main>
        </SidebarProvider>
    );
};

export default FormFilling;
