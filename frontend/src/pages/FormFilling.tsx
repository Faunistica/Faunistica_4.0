import { type FC, useEffect, useState, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';

import type { RootState } from '@/store/store';
import type { FormRecord } from '@/types/api.dto';
import { formRecordSchema } from '@/types/forms';
import { recordAPI, useRecordsListQuery, useCreateRecordMutation } from '@/api/recordAPI';

import ArticleSourceCard from '@/components/form/ArticleSourceCard';
import GeographyCard from '@/components/form/GeographyCard';
import CollectionEventCard from '@/components/form/CollectionEventCard';
import TaxonomyCard from '@/components/form/TaxonomyCard';
import QuantitiesCard from '@/components/form/QuantitiesCard';
import FormSidebar from '@/components/form/FormSidebar';
import Footer from '@/components/form/FormFooter';
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

    const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
    const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

    const { data: recordsData, isLoading } = useRecordsListQuery(
        { publ_id, user_id: user_id! },
        { skip: !user_id || !publ_id },
    );

    const [createRecord] = useCreateRecordMutation();

    const methods = useForm<FormRecord>({
        resolver: zodResolver(formRecordSchema),
        defaultValues: undefined,
        mode: 'onTouched',
        reValidateMode: 'onChange',
    });

    const { reset } = methods;

    useEffect(() => {
        if (recordsData?.items && !hasLoadedInitial) {
            const items = recordsData.items;
            if (items.length > 0) {
                const firstId = items[0].id;
                setActiveRecordId(firstId);
                const cached = recordAPI.util.getQueryData('recordById', { record_id: firstId });
                if (cached) {
                    reset(cached);
                }
            }
            setHasLoadedInitial(true);
        }
    }, [recordsData, reset, hasLoadedInitial]);

    const handleCreate = useCallback(async () => {
        try {
            const created = await createRecord({ publ_id }).unwrap();
            setActiveRecordId(created.id);
            reset(created);
        } catch {
            // error handled by RTK
        }
    }, [publ_id, createRecord, reset]);

    if (isLoading) return <LoadingScreen />;

    const records = recordsData?.items ?? [];

    return (
        <FormProvider {...methods}>
            <SidebarProvider
                open={true}
                openMobile={isSidebarOpen}
                onOpenMobileChange={setIsSidebarOpen}
                className="flex-1"
            >
                <FormSidebar
                    records={records}
                    activeRecordId={activeRecordId}
                    onSelectRecord={setActiveRecordId}
                    onCreateRecord={handleCreate}
                />
                <main className="flex-1 flex flex-col w-full min-w-0 relative">
                    <div className="flex-1 w-full p-4 md:p-8 pb-[180px] md:pb-[120px]">
                        <div className="max-w-6xl mx-auto space-y-6">
                            {activeRecordId ? (
                                <>
                                    <div className="relative z-20 focus-within:z-50 transition-all duration-200 mb-6">
                                        <ArticleSourceCard publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-15 focus-within:z-50 transition-all duration-200">
                                        <GeographyCard publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-10 focus-within:z-50 transition-all duration-200">
                                        <CollectionEventCard publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-5 focus-within:z-50 transition-all duration-200">
                                        <TaxonomyCard />
                                    </div>
                                    <div className="relative z-0 focus-within:z-50 transition-all duration-200">
                                        <QuantitiesCard />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 gap-6">
                                    <p className="text-lg text-slate-500">Нет записей</p>
                                    <Button onClick={handleCreate} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Создать запись
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <Footer />
                </main>
            </SidebarProvider>
        </FormProvider>
    );
};

export default FormFilling;
