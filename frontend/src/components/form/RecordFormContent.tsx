import { type FC, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormRecord } from '@/types/api.dto';
import { formRecordSchema } from '@/types/forms';
import { useRecordByIdQuery } from '@/api/recordAPI';
import { useRecordForm } from '@/hooks/useRecordForm';
import ArticleSourceCard from '@/components/form/ArticleSourceCard';
import GeographyCard from '@/components/form/GeographyCard';
import CollectionEventCard from '@/components/form/CollectionEventCard';
import TaxonomyCard from '@/components/form/TaxonomyCard';
import QuantitiesCard from '@/components/form/QuantitiesCard';
import ServerErrorDisplay from '@/components/form/ServerErrorDisplay';
import Footer from '@/components/form/FormFooter';
import LoadingScreen from '@/components/LoadingScreen';

interface RecordFormContentProps {
    publ_id: number;
    activeRecordId: string;
    registerSave: (fn: (options?: { silent?: boolean }) => Promise<void>) => void;
    deleteRecord: (id: string) => void;
}

const RecordFormContent: FC<RecordFormContentProps> = ({
    publ_id,
    activeRecordId,
    registerSave,
    deleteRecord,
}) => {
    const { currentData: activeRecord } = useRecordByIdQuery(
        { record_id: activeRecordId },
        { refetchOnMountOrArgChange: true },
    );

    const methods = useForm<FormRecord>({
        resolver: zodResolver(formRecordSchema),
        defaultValues: undefined,
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    const {
        handleSave,
        handleSubmit,
        isSaving,
        isAutoSaving,
        lastSavedTime,
        nonFieldErrors,
    } = useRecordForm({
        activeRecordId,
        activeRecord,
        methods,
        publ_id,
        user_id: activeRecord?.user_id ?? 0,
        registerSave,
    });

    const handleDelete = useCallback(
        () => deleteRecord(activeRecordId),
        [deleteRecord, activeRecordId],
    );

    if (!activeRecord) {
        return <LoadingScreen />;
    }

    return (
        <FormProvider {...methods}>
            <div className="w-full flex-1 p-4 pb-45 md:p-8 md:pb-30">
                <div className="mx-auto max-w-6xl space-y-6">
                    <ArticleSourceCard publ_id={publ_id} />
                    <GeographyCard publ_id={publ_id} activeRecordId={activeRecordId} />
                    <CollectionEventCard publ_id={publ_id} activeRecordId={activeRecordId} />
                    <TaxonomyCard />
                    <QuantitiesCard />
                    <ServerErrorDisplay errors={nonFieldErrors} />
                </div>
            </div>
            <Footer
                onSave={handleSave}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                isSaving={isSaving}
                isAutoSaving={isAutoSaving}
                lastSavedTime={lastSavedTime}
            />
        </FormProvider>
    );
};

export default RecordFormContent;
