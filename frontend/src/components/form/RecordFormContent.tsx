import { type FC, useCallback, useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormRecord, RecordFull, UpdateRecordResponse } from '@/types/api.dto';
import { recordFormSchema, FORM_DEFAULT_VALUES } from '@/types/forms';
import { useRecordByIdQuery } from '@/api/recordAPI';
import { useSaveRecord } from '@/hooks/useSaveRecord';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSyncRecordToForm } from '@/hooks/useSyncRecordToForm';
import { toFormPartial } from '@/lib/recordUtils';
import { syncServerErrors } from '@/lib/syncServerErrors';
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
        resolver: zodResolver(recordFormSchema),
        defaultValues: FORM_DEFAULT_VALUES,
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);

    useEffect(() => {
        setNonFieldErrors([]);
        setLastSavedTime(null);
    }, [activeRecordId]);

    const { save, submit, isSaving, isSavingRef, shouldSkipSync } = useSaveRecord(
        activeRecordId,
        publ_id,
    );

    const handleSaveResult = useCallback(
        (response: UpdateRecordResponse) => {
            setNonFieldErrors(syncServerErrors(response, methods));
            setLastSavedTime(new Date());
        },
        [methods],
    );

    const onAutoSaved = useCallback(() => {
        setLastSavedTime(new Date());
    }, []);

    const { isAutoSaving, cancelPendingAutoSave } = useAutoSave({
        save,
        methods,
        isSavingRef,
        onSaved: onAutoSaved,
    });

    const handleSave = useCallback(async () => {
        cancelPendingAutoSave();
        const response = await save(methods.getValues());
        if (response) handleSaveResult(response);
    }, [save, methods, cancelPendingAutoSave, handleSaveResult]);

    const handleSubmit = useCallback(async () => {
        cancelPendingAutoSave();
        const response = await submit(methods.getValues());
        if (response) handleSaveResult(response);
    }, [submit, methods, cancelPendingAutoSave, handleSaveResult]);

    const handleDelete = useCallback(
        () => deleteRecord(activeRecordId),
        [deleteRecord, activeRecordId],
    );

    useSyncRecordToForm(
        activeRecord,
        useCallback(
            (record: RecordFull) => {
                if (shouldSkipSync(record.updated_at)) return;
                methods.reset(toFormPartial(record), {
                    keepValues: false,
                    keepErrors: false,
                    keepTouched: false,
                    keepDirty: false,
                });
            },
            [methods, shouldSkipSync],
        ),
    );

    useEffect(() => {
        registerSave(async () => {
            cancelPendingAutoSave();
            await save(methods.getValues());
        });
    }, [save, methods, registerSave, cancelPendingAutoSave]);

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
