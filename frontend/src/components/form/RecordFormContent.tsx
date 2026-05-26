import { type FC, useEffect, useRef } from 'react';
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
    registerSave: (fn: (options?: { silent?: boolean }) => Promise<void>) => void;
    deleteRecord: (id: string) => void;
}

const RecordFormContent: FC<RecordFormContentProps> = ({
    publ_id,
    activeRecord,
    records,
    registerSave: onRegisterSave,
    deleteRecord: onDelete,
}) => {
    const methods = useForm<FormRecord>({
        resolver: zodResolver(formRecordSchema),
        defaultValues: undefined,
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    const cancelAutoSaveRef = useRef<(() => void) | undefined>(undefined);

    const { save, submit, isSaving, nonFieldErrors, isSavingRef } = useSaveRecord(
        activeRecord.id,
        methods,
        publ_id,
        activeRecord.user_id,
        cancelAutoSaveRef,
    );
    const { isAutoSaving, lastSavedTime, cancelPendingAutoSave } = useAutoSave({
        save: (data) => save(data),
        methods,
        isSavingRef,
    });

    cancelAutoSaveRef.current = cancelPendingAutoSave;

    const { getValues, reset } = methods;

    useEffect(() => {
        onRegisterSave((options) => save(getValues(), options));
    }, [save, getValues, onRegisterSave]);

    useEffect(() => {
        reset(toFormPartial(activeRecord), {
            keepErrors: false,
            keepTouched: false,
            keepDirty: false,
        });
    }, [activeRecord, reset]);

    const otherRecords = records.filter((r) => r.id !== activeRecord.id);

    return (
        <FormProvider {...methods}>
            <div className="w-full flex-1 p-4 pb-45 md:p-8 md:pb-30">
                <div className="mx-auto max-w-6xl space-y-6">
                    <ArticleSourceCard publ_id={publ_id} />
                    <GeographyCard otherRecords={otherRecords} />
                    <CollectionEventCard otherRecords={otherRecords} />
                    <TaxonomyCard />
                    <QuantitiesCard />
                    <ServerErrorDisplay errors={nonFieldErrors} />
                </div>
            </div>
            <Footer
                onSave={() => save(getValues())}
                onSubmit={() => submit(getValues())}
                onDelete={() => onDelete(activeRecord.id)}
                isSaving={isSaving}
                isAutoSaving={isAutoSaving}
                lastSavedTime={lastSavedTime}
            />
        </FormProvider>
    );
};

export default RecordFormContent;
