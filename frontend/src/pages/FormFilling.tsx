// src/pages/FormFilling.tsx
//
// ── FIX LOG ──────────────────────────────────────────────────────────────
// 1. BLOCKING_FIELDS: prepend НЕ вызывается до завершения валидации.
// 2. «Исправить сейчас» — скролл по ключу поля, а не по label.
// 3. Автосохранение — snapshot-сравнение; пропуск если данные не менялись.
// 4. Renamed: Sample → Record.
// 5. Массовая валидация (handleValidateAll) с validationErrors map.
// 6. Excel-импорт: onImportComplete перезагружает данные через refetch.
// 7. Логика вынесена в хуки: useRecordPersistence, useRecordValidation,
//    useAutoSave — страница стала тонким оркестратором.
// ─────────────────────────────────────────────────────────────────────────

import { type FC, useEffect, useState, useCallback, memo } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

import type { RootState } from '@/store/store';
import { useGetRecordsDataQuery } from '@/api/recordAPI';
import { formSchema, type FormSchema } from '@/types/forms';
import { groupRecordsIntoDrafts } from '@/lib/recordUtils';

import { useRecordPersistence } from '@/hooks/useRecordPersistence';
import { useRecordValidation } from '@/hooks/useRecordValidation';
import { useAutoSave } from '@/hooks/useAutoSave';

import ArticleSourceCard from '@/components/form/ArticleSourceCard';
import GeographyCard from '@/components/form/GeographyCard';
import CollectionEventCard from '@/components/form/CollectionEventCard';
import TaxonomyCard from '@/components/form/TaxonomyCard';
import QuantitiesCard from '@/components/form/QuantitiesCard';
import FormSidebar from '@/components/form/FormSidebar';
import Footer from '@/components/form/FormFooter';
import { SidebarProvider } from '@/components/ui/sidebar';
import LoadingScreen from '@/components/LoadingScreen';

// ── Layout context ──
interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

// ── React.memo wrappers (Requirement #4) ──
// Каждая карточка перерендеривается только при смене своего index / publ_id.
const MemoGeographyCard = memo(GeographyCard, (prev, next) =>
    prev.index === next.index && prev.publ_id === next.publ_id,
);
MemoGeographyCard.displayName = 'MemoGeographyCard';

const MemoCollectionEventCard = memo(CollectionEventCard, (prev, next) =>
    prev.index === next.index && prev.publ_id === next.publ_id,
);
MemoCollectionEventCard.displayName = 'MemoCollectionEventCard';

const MemoTaxonomyCard = memo(TaxonomyCard, (prev, next) =>
    prev.index === next.index,
);
MemoTaxonomyCard.displayName = 'MemoTaxonomyCard';

const MemoQuantitiesCard = memo(QuantitiesCard, (prev, next) =>
    prev.index === next.index,
);
MemoQuantitiesCard.displayName = 'MemoQuantitiesCard';

// ═════════════════════════════════════════════════════════════════════════
// FormFilling — тонкий оркестратор
// ═════════════════════════════════════════════════════════════════════════
const FormFilling: FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<OutletContextType>();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const publ_id = Number(id);
    const user_id = useSelector((state: RootState) => state.user.user_id);

    const [activeRecordIndex, setActiveRecordIndex] = useState(0);

    // ── RTK Query ──
    const { data: recordsData, isLoading, refetch } = useGetRecordsDataQuery(
        { publ_id, user_id: user_id! },
        { skip: !user_id || !publ_id },
    );

    // ── React Hook Form ──
    const methods = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: { samples: [{}] },
        mode: 'onTouched',
        reValidateMode: 'onChange',
    });

    const { control, reset, getValues, trigger, formState: { isValid } } = methods;
    const fieldArray = useFieldArray({ control, name: 'samples' });
    const { fields, remove } = fieldArray;

    // ── Хук: серверная персистенция ──
    const { handleSave, handleManualSave, deleteServerRecords, createRecord } =
        useRecordPersistence({ publ_id, user_id: user_id!, methods });

    // ── Хук: валидация (блокировка + массовая) ──
    const {
        addRecord,
        handleValidateAll,
        validationErrors,
        isValidating,
        clearValidationError,
        resetValidationErrors,
    } = useRecordValidation({
        methods,
        fieldArray,
        activeRecordIndex,
        setActiveRecordIndex,
        createServerRecord: createRecord,
        publ_id,
        user_id: user_id!,
    });

    // ── Хук: автосохранение ──
    const { isAutoSaving, lastSavedTime } = useAutoSave({
        methods,
        handleSave,
    });

    // ── Загрузка данных (только если форма не «грязная») ──
    useEffect(() => {
        if (recordsData?.items && !methods.formState.isDirty) {
            const drafts = groupRecordsIntoDrafts(recordsData.items);
            reset({ samples: drafts.length > 0 ? (drafts as any) : [{}] });
        }
    }, [recordsData, reset, methods.formState.isDirty]);

    // ── Удаление записи ──
    const removeRecord = useCallback(
        async (index: number) => {
            await deleteServerRecords(index);
            remove(index);
            setActiveRecordIndex((prev) => {
                const newLength = fields.length - 1;
                if (newLength === 0) return 0;
                if (prev === index) return 0;
                if (index < prev) return prev - 1;
                return prev;
            });
            clearValidationError(index);
        },
        [deleteServerRecords, remove, fields.length, clearValidationError],
    );

    // ── Импорт завершён — перезагрузить данные ──
    const handleImportComplete = useCallback(() => {
        refetch();
        setActiveRecordIndex(0);
        resetValidationErrors();
    }, [refetch, resetValidationErrors]);

    // ── Финальная отправка ──
    const handleFinalSubmit = useCallback(async () => {
        const valid = await trigger();
        if (valid) {
            try {
                await handleSave(getValues(), false);
                toast.success('Успех!', {
                    description: 'Ваши данные были успешно отправлены.',
                    duration: 3000,
                });
                navigate('/dashboard');
                return true;
            } catch (error) {
                toast.error('Ошибка при отправке данных');
                console.error(error);
                return false;
            }
        } else {
            toast.error('Пожалуйста, заполните все обязательные поля');
            const firstErrorField = document.querySelector('[aria-invalid="true"]');
            firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
    }, [trigger, getValues, handleSave, navigate]);

    // ── Loading ──
    if (isLoading) return <LoadingScreen />;

    // ── Render ──
    return (
        <FormProvider {...methods}>
            <SidebarProvider
                open={true}
                openMobile={isSidebarOpen}
                onOpenMobileChange={setIsSidebarOpen}
                className="flex-1"
            >
                <FormSidebar
                    activeRecordIndex={activeRecordIndex}
                    setActiveRecordIndex={setActiveRecordIndex}
                    addRecord={addRecord}
                    removeRecord={removeRecord}
                    validationErrors={validationErrors}
                    onImportComplete={handleImportComplete}
                />

                <main className="flex-1 flex flex-col w-full min-w-0 relative">
                    <div className="flex-1 w-full p-4 md:p-8 pb-[180px] md:pb-[120px]">
                        <div className="max-w-6xl mx-auto space-y-6">
                            {fields.length > 0 && (
                                <>
                                    <div className="relative z-20 focus-within:z-50 transition-all duration-200">
                                        <ArticleSourceCard publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-15 focus-within:z-50 transition-all duration-200">
                                        <MemoGeographyCard
                                            key={`geo-${activeRecordIndex}`}
                                            index={activeRecordIndex}
                                            publ_id={publ_id}
                                        />
                                    </div>
                                    <div className="relative z-10 focus-within:z-50 transition-all duration-200">
                                        <MemoCollectionEventCard
                                            key={`event-${activeRecordIndex}`}
                                            index={activeRecordIndex}
                                            publ_id={publ_id}
                                        />
                                    </div>
                                    <div className="relative z-5 focus-within:z-50 transition-all duration-200">
                                        <MemoTaxonomyCard
                                            key={`tax-${activeRecordIndex}`}
                                            index={activeRecordIndex}
                                        />
                                    </div>
                                    <div className="relative z-0 focus-within:z-50 transition-all duration-200">
                                        <MemoQuantitiesCard
                                            key={`quant-${activeRecordIndex}`}
                                            index={activeRecordIndex}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <Footer
                        isAutoSaving={isAutoSaving}
                        lastSavedTime={lastSavedTime}
                        onSaveAll={handleManualSave}
                        onValidateAll={handleValidateAll}
                        onSubmit={handleFinalSubmit}
                        isValid={isValid}
                        isValidating={isValidating}
                    />
                </main>
            </SidebarProvider>
        </FormProvider>
    );
};

export default FormFilling;