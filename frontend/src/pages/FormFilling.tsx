import { type FC } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { useRecordsManager } from '@/hooks/useRecordsManager';
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

    const { activeRecordId, isLoading, recordMethods, registerSave } = useRecordsManager(publ_id);

    if (isLoading) return <LoadingScreen />;

    return (
        <SidebarProvider
            open={true}
            openMobile={isSidebarOpen}
            onOpenMobileChange={setIsSidebarOpen}
        >
            <FormSidebar
                activeRecordId={activeRecordId}
                onSelectRecord={recordMethods.switchTo}
                onCreateRecord={recordMethods.create}
                deleteRecord={recordMethods.delete}
                publ_id={publ_id}
            />
            <main className="relative flex w-full min-w-0 flex-1 flex-col">
                {activeRecordId ? (
                    <RecordFormContent
                        publ_id={publ_id}
                        activeRecordId={activeRecordId}
                        registerSave={registerSave}
                        deleteRecord={recordMethods.delete}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-6 py-24">
                        <p className="text-lg text-slate-500">Нет записей</p>
                        <Button onClick={recordMethods.create} className="gap-2">
                            <Plus className="size-4" />
                            Создать запись
                        </Button>
                    </div>
                )}
            </main>
        </SidebarProvider>
    );
};

export default FormFilling;
