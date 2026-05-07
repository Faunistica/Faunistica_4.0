// src/pages/FormFilling.tsx
import { type FC, useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

import type { RootState } from '@/store/store';
import type { DraftRecord } from '@/types/api.dto';
import { useGetRecordsDataQuery, useCreateRecordMutation, useEditRecordMutation, useDeleteRecordMutation } from '@/api/recordAPI';

import { formSchema, type FormSchema, QUANTITY_FIELDS, BLOCKING_FIELDS, getFieldLabel } from '@/types/forms';
import { groupRecordsIntoDrafts, getSexAndLifestageFromField, draftToRecordData } from '@/lib/recordUtils';

import ArticleSourceCard from '@/components/form/ArticleSourceCard';
import GeographyCard from '@/components/form/GeographyCard';
import CollectionEventCard from '@/components/form/CollectionEventCard';
import TaxonomyCard from '@/components/form/TaxonomyCard';
import QuantitiesCard from '@/components/form/QuantitiesCard';
import FormSidebar from '@/components/form/FormSidebar';
import Footer from '@/components/form/FormFooter';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/LoadingScreen';

interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const FormFilling: FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<OutletContextType>();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const publ_id = Number(id);
    const user_id = useSelector((state: RootState) => state.user.user_id);

    const [activeSampleIndex, setActiveSampleIndex] = useState(0);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

    const { data: recordsData, isLoading } = useGetRecordsDataQuery(
        { publ_id, user_id: user_id! },
        { skip: !user_id || !publ_id },
    );

    const [createRecord] = useCreateRecordMutation();
    const [editRecord] = useEditRecordMutation();
    const [deleteRecord] = useDeleteRecordMutation();

    // 🔧 Ключевое: onTouched + onChange для баланса между навязчивостью и отзывчивостью
    const methods = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: { samples: [{}] },
        mode: 'onTouched',
        reValidateMode: 'onChange',
    });

    const { control, reset, getValues, watch, trigger, setValue, formState: { isValid } } = methods;
    const { fields, prepend, remove } = useFieldArray({ control, name: 'samples' });

    // ── 1. Загрузка данных (только если форма не "грязная") ──
    useEffect(() => {
        if (recordsData?.items && !methods.formState.isDirty) {
            const drafts = groupRecordsIntoDrafts(recordsData.items);
            reset({ samples: drafts.length > 0 ? (drafts as any) : [{}] });
        }
    }, [recordsData, reset, methods.formState.isDirty]);

    // ── 2. Автосохранение (НЕ блокирует, сохраняет даже с ошибками) ──
    useEffect(() => {
        const subscription = watch((_, { name, type }) => {
            if (type === 'change') {
                const match = name?.match(/^samples\.(\d+)/);
                const changedIndex = match ? parseInt(match[1]) : undefined;

                if (autoSaveTimeoutRef.current) {
                    clearTimeout(autoSaveTimeoutRef.current);
                }
                autoSaveTimeoutRef.current = setTimeout(async () => {
                    setIsAutoSaving(true);
                    try {
                        // ❗ Автосохранение сохраняем только измененный образец
                        await handleSave(getValues(), false, changedIndex);
                        setLastSavedTime(new Date());
                    } catch (error) {
                        console.error('Auto-save error:', error);
                    } finally {
                        setIsAutoSaving(false);
                    }
                }, 2000);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    // ── 3. Мягкая блокировка при добавлении образца ──
    const addSample = useCallback(async () => {
        const prefix = `samples.${activeSampleIndex}`;

        // Проверяем только блокирующие поля текущего образца
        const validationPromises = BLOCKING_FIELDS.map(field =>
            trigger(`${prefix}.${field}` as any)
        );
        const results = await Promise.all(validationPromises);
        const hasErrors = results.some(r => !r);

        if (hasErrors) {
            const missing = BLOCKING_FIELDS.filter((_, i) => !results[i])
                .map(f => getFieldLabel(f));

            // 🎯 Кастомный тост с выбором
            toast.custom((t) => (
                <div className="bg-white p-4 rounded-lg shadow-lg border max-w-md">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-slate-900">Заполните обязательные поля</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                Перед созданием нового образца завершите текущий:
                            </p>
                            <ul className="mt-2 text-sm text-slate-700 space-y-1">
                                {missing.map(field => (
                                    <li key={field} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        {field}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                // Скролл к первой ошибке
                                const firstField = missing[0]?.toLowerCase().replace(/\s+/g, '_');
                                if (firstField) {
                                    const el = document.querySelector(`[name*="${firstField}"][aria-invalid="true"]`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    (el as HTMLElement)?.focus();
                                }
                                toast.dismiss(t);
                            }}
                        >
                            Исправить сейчас
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                // 🔓 Escape hatch для экспертов
                                prepend({});
                                setActiveSampleIndex(0);
                                toast.dismiss(t);
                                toast.info('Новый образец создан. Не забудьте вернуться и заполнить предыдущий.', { duration: 4000 });
                            }}
                        >
                            Всё равно создать
                        </Button>
                    </div>
                </div>
            ), { duration: Infinity });

            return; // Блокируем создание
        }

        // ✅ Всё ок — создаём
        try {
            console.log(publ_id, user_id)
            const created = await createRecord({ publ_id, user_id: user_id! }).unwrap();
            prepend({ record_ids: { base: created.id } });
            setActiveSampleIndex(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            toast.error("Не удалось создать образец на сервере");
        }
    }, [activeSampleIndex, prepend, trigger, createRecord, publ_id, user_id]);

    // ── 4. Удаление образца ──
    const removeSample = async (index: number) => {
        const sample = getValues(`samples.${index}`) as DraftRecord;
        if (sample.record_ids) {
            for (const record_id of Object.values(sample.record_ids)) {
                await deleteRecord({ record_id, user_id: user_id! });
            }
            toast.success('Образец удалён из базы данных');
        }
        remove(index);
        setActiveSampleIndex((prev) => {
            const newLength = fields.length - 1;
            if (newLength === 0) return 0;
            if (prev === index) return 0;
            if (index < prev) return prev - 1;
            return prev;
        });
    };

    // ── 5. Сохранение (вынесено отдельно) ──
    const handleSave = async (data: FormSchema, isManual: boolean, targetIndex?: number) => {
        try {
            const indicesToSave = targetIndex !== undefined
                ? [targetIndex]
                : Array.from({ length: data.samples.length }, (_, i) => i);

            for (const i of indicesToSave) {
                const sample = data.samples[i];
                if (!sample) continue;

                const baseData = draftToRecordData(sample, publ_id);
                const newRecordIds: Record<string, string> = { ...sample.record_ids };

                const filledQuantities = QUANTITY_FIELDS.filter(f => {
                    const q = (sample as any)[f];
                    return q !== undefined && q !== null && q > 0;
                });

                if (filledQuantities.length === 0) {
                    // No quantities filled. Save to base record.
                    const existingIds = Object.values(newRecordIds);
                    if (existingIds.length > 0) {
                        await editRecord({ ...baseData, record_id: existingIds[0], user_id: user_id! }).unwrap();
                        for (let j = 1; j < existingIds.length; j++) {
                            await deleteRecord({ record_id: existingIds[j], user_id: user_id! }).unwrap();
                        }
                        for (const key in newRecordIds) delete newRecordIds[key];
                        newRecordIds['base'] = existingIds[0];
                    } else {
                        const created = await createRecord({ publ_id, user_id: user_id! }).unwrap();
                        await editRecord({ ...baseData, record_id: created.id, user_id: user_id! }).unwrap();
                        newRecordIds['base'] = created.id;
                    }
                } else {
                    let baseIdToReuse = newRecordIds['base'];
                    if (baseIdToReuse) {
                        delete newRecordIds['base'];
                    }

                    for (const field of QUANTITY_FIELDS) {
                        const quantity = (sample as any)[field];
                        let existingId = sample.record_ids?.[field];

                        if (quantity !== undefined && quantity !== null && quantity > 0) {
                            const { sex, life_stage } = getSexAndLifestageFromField(field);
                            const recordData = { ...baseData, quantity, sex, life_stage };

                            if (!existingId && baseIdToReuse) {
                                existingId = baseIdToReuse;
                                baseIdToReuse = undefined;
                            }

                            if (existingId) {
                                await editRecord({ ...recordData, record_id: existingId, user_id: user_id! }).unwrap();
                                newRecordIds[field] = existingId;
                            } else {
                                const created = await createRecord({ publ_id, user_id: user_id! }).unwrap();
                                await editRecord({ ...recordData, record_id: created.id, user_id: user_id! }).unwrap();
                                newRecordIds[field] = created.id;
                            }
                        } else if (existingId) {
                            await deleteRecord({ record_id: existingId, user_id: user_id! }).unwrap();
                            delete newRecordIds[field];
                        }
                    }

                    if (baseIdToReuse) {
                        await deleteRecord({ record_id: baseIdToReuse, user_id: user_id! }).unwrap();
                    }
                }

                setValue(`samples.${i}.record_ids` as any, newRecordIds, { shouldDirty: false, shouldValidate: false });
            }
            if (isManual) toast.success('Данные успешно сохранены');
        } catch (error) {
            if (isManual) {
                toast.error('Ошибка при сохранении данных');
                // 🔥 При ручной попытке — показываем ВСЕ ошибки
                trigger();
            }
            throw error;
        }
    };

    const handleManualSave = async () => {
        try {
            await handleSave(getValues(), true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFinalSubmit = async () => {
        const isValid = await trigger();
        if (isValid) {
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
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <FormProvider {...methods}>
            <SidebarProvider open={true} openMobile={isSidebarOpen} onOpenMobileChange={setIsSidebarOpen} className="flex-1">
                <FormSidebar
                    activeSampleIndex={activeSampleIndex}
                    setActiveSampleIndex={setActiveSampleIndex}
                    addSample={addSample}
                    removeSample={removeSample}
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
                                        <GeographyCard key={`geo-${activeSampleIndex}`} index={activeSampleIndex} publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-10 focus-within:z-50 transition-all duration-200">
                                        <CollectionEventCard key={`event-${activeSampleIndex}`} index={activeSampleIndex} publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-5 focus-within:z-50 transition-all duration-200">
                                        <TaxonomyCard key={`tax-${activeSampleIndex}`} index={activeSampleIndex} />
                                    </div>
                                    <div className="relative z-0 focus-within:z-50 transition-all duration-200">
                                        <QuantitiesCard key={`quant-${activeSampleIndex}`} index={activeSampleIndex} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <Footer
                        isAutoSaving={isAutoSaving}
                        lastSavedTime={lastSavedTime}
                        onSaveDraft={handleManualSave}
                        onSubmit={handleFinalSubmit}
                        isValid={isValid}
                    />
                </main>
            </SidebarProvider>
        </FormProvider>
    );
};

export default FormFilling;