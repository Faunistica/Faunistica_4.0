import { type FC, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RecordFull, FormRecord } from '@/types/api.dto';
import { formRecordSchema } from '@/types/forms';
import { useSaveRecord } from '@/hooks/useSaveRecord';
import { useAutoSave } from '@/hooks/useAutoSave';
import { toFormPartial } from '@/lib/recordUtils';
import ArticleSourceCard from '@/components/form/ArticleSourceCard';
import GeographyCard from '@/components/form/GeographyCard';
import CollectionEventCard from '@/components/form/CollectionEventCard';
import TaxonomyCard from '@/components/form/TaxonomyCard';
import QuantitiesCard from '@/components/form/QuantitiesCard';
import ServerErrorDisplay from '@/components/form/ServerErrorDisplay';
import Footer from '@/components/form/FormFooter';

interface RecordFormContentProps {
    publ_id: number;
    activeRecord: RecordFull;
    records: RecordFull[];
    onRegisterSave: (fn: () => Promise<void>) => void;
    onDelete: (id: string) => void;
}

const RecordFormContent: FC<RecordFormContentProps> = ({
    publ_id,
    activeRecord,
    records,
    onRegisterSave,
    onDelete,
}) => {
    const activeRecordId = activeRecord.id;
    const methods = useForm<FormRecord>({
        resolver: zodResolver(formRecordSchema),
        defaultValues: undefined,
        mode: 'onTouched',
        reValidateMode: 'onChange',
    });

    const { save, submit, isSaving, nonFieldErrors } = useSaveRecord(activeRecordId, methods);
    const { isAutoSaving, lastSavedTime } = useAutoSave({
        save,
        methods,
    });

    const { getValues, reset } = methods;

    useEffect(() => {
        onRegisterSave(() => save(getValues()));
    }, [save, getValues, onRegisterSave]);

    useEffect(() => {
        reset(toFormPartial(activeRecord));
    }, [activeRecord, reset]);

    return (
        <FormProvider {...methods} key={activeRecordId}>
            <div className="w-full flex-1 p-4 pb-45 md:p-8 md:pb-30">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="relative z-20 mb-6 transition-all duration-200 focus-within:z-50">
                        <ArticleSourceCard publ_id={publ_id} />
                    </div>
                    <div className="relative z-15 transition-all duration-200 focus-within:z-50">
                        <GeographyCard
                            publ_id={publ_id}
                            otherRecords={records.filter((r) => r.id !== activeRecord.id)}
                        />
                    </div>
                    <div className="relative z-10 transition-all duration-200 focus-within:z-50">
                        <CollectionEventCard
                            publ_id={publ_id}
                            otherRecords={records.filter((r) => r.id !== activeRecord.id)}
                        />
                    </div>
                    <div className="relative z-5 transition-all duration-200 focus-within:z-50">
                        <TaxonomyCard />
                    </div>
                    <div className="relative z-0 transition-all duration-200 focus-within:z-50">
                        <QuantitiesCard />
                    </div>
                    <ServerErrorDisplay errors={nonFieldErrors} />
                </div>
            </div>
            <Footer
                onSave={() => save(getValues())}
                onSubmit={() => submit(getValues())}
                onDelete={() => onDelete(activeRecordId)}
                isSaving={isSaving}
                isAutoSaving={isAutoSaving}
                lastSavedTime={lastSavedTime}
            />
        </FormProvider>
    );
};

export default RecordFormContent;
