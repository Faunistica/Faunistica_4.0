import { type FC } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RecordFormProvider } from '@/contexts/RecordFormProvider';
import type { FormRecord } from '@/types/api.dto';
import { recordFormSchema, FORM_DEFAULT_VALUES } from '@/types/forms';
import RecordFormContent from '@/components/form/RecordFormContent';
import FormSidebar from '@/components/form/sidebar/FormSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRecordForm } from '@/contexts/useRecordForm';

interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const FormFillingInner: FC<OutletContextType> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const {
        state: { activeRecordId, isInitialLoading },
        actions: { create },
    } = useRecordForm();

    if (isInitialLoading) return <LoadingScreen />;

    return (
        <SidebarProvider
            open={true}
            openMobile={isSidebarOpen}
            onOpenMobileChange={setIsSidebarOpen}
        >
            <FormSidebar />
            <main className="relative flex w-full min-w-0 flex-1 flex-col">
                {activeRecordId ? (
                    <RecordFormContent />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-6 py-24">
                        <p className="text-lg text-slate-500">Нет записей</p>
                        <Button onClick={create} className="gap-2">
                            <Plus className="size-4" />
                            Создать запись
                        </Button>
                    </div>
                )}
            </main>
        </SidebarProvider>
    );
};

const FormFilling: FC = () => {
    const outletContext = useOutletContext<OutletContextType>();
    const { id } = useParams<{ id: string }>();
    const publ_id = Number(id);

    const methods = useForm<FormRecord>({
        resolver: zodResolver(recordFormSchema),
        defaultValues: FORM_DEFAULT_VALUES,
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    return (
        <RecordFormProvider publ_id={publ_id} methods={methods}>
            <FormProvider {...methods}>
                <FormFillingInner {...outletContext} />
            </FormProvider>
        </RecordFormProvider>
    );
};

export default FormFilling;
