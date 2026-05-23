import { type FC, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

import type { RootState } from '@/store/store';
import type { FormRecord } from '@/types/api.dto';
import { formRecordSchema } from '@/types/forms';
import {
    recordAPI,
    useRecordsListQuery,
    useLazyRecordByIdQuery,
    useCreateRecordMutation,
    useDeleteRecordMutation,
} from '@/api/recordAPI';
import { useAppDispatch } from '@/store/store';

import ArticleSourceCard from '@/components/form/ArticleSourceCard';
import GeographyCard from '@/components/form/GeographyCard';
import CollectionEventCard from '@/components/form/CollectionEventCard';
import TaxonomyCard from '@/components/form/TaxonomyCard';
import QuantitiesCard from '@/components/form/QuantitiesCard';
import ServerErrorDisplay from '@/components/form/ServerErrorDisplay';
import FormSidebar from '@/components/form/FormSidebar';
import Footer from '@/components/form/FormFooter';
import { SidebarProvider } from '@/components/ui/sidebar';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSaveRecord } from '@/hooks/useSaveRecord';
import { toFormPartial } from '@/lib/recordUtils';
import { useRecordStatus, type RecordStatus } from '@/hooks/useRecordStatus';

const SHOULD_AUTO_SAVE = !(import.meta.env.VITE_DISABLE_AUTO_SAVE?.toLowerCase?.() === 'true');

interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const SERVER_STATUS_MAP: Record<string, RecordStatus> = {
    rec_ok: 'valid',
    check_ok: 'valid',
    rec_fail: 'error',
    check_fail: 'error',
    rec_del: 'error',
};

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
    const [fetchRecordById] = useLazyRecordByIdQuery();
    const [deleteRecord] = useDeleteRecordMutation();
    const dispatch = useAppDispatch();

    const methods = useForm<FormRecord>({
        resolver: zodResolver(formRecordSchema),
        defaultValues: undefined,
        mode: 'onTouched',
        reValidateMode: 'onChange',
    });

    const { reset, getValues } = methods;

    const { save, submit, isSaving, nonFieldErrors } = useSaveRecord(activeRecordId, methods);

    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastSnapshotRef = useRef<string>('');
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

    const cancelPendingAutoSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = undefined;
        }
    }, []);

    useEffect(() => {
        if (!SHOULD_AUTO_SAVE) {
            return () => {};
        }

        const subscription = methods.watch((_value, { type }) => {
            if (type !== 'change') return;

            cancelPendingAutoSave();

            autoSaveTimerRef.current = setTimeout(async () => {
                const currentValues = getValues();
                const currentSnapshot = JSON.stringify(currentValues);

                if (currentSnapshot === lastSnapshotRef.current) {
                    return;
                }

                setIsAutoSaving(true);
                try {
                    await save(currentValues);
                    lastSnapshotRef.current = currentSnapshot;
                    setLastSavedTime(new Date());
                } catch {
                    // auto-save errors handled by useSaveRecord
                } finally {
                    setIsAutoSaving(false);
                }
            }, 2000);
        });

        return () => {
            subscription.unsubscribe();
            cancelPendingAutoSave();
        };
    }, [methods, getValues, save, cancelPendingAutoSave]);

    useEffect(() => {
        if (activeRecordId) {
            lastSnapshotRef.current = JSON.stringify(getValues());
        }
    }, [activeRecordId, getValues]);

    useEffect(() => {
        if (recordsData?.items && !hasLoadedInitial) {
            const items = recordsData.items;
            if (items.length > 0) {
                const firstId = items[0].id;
                setActiveRecordId(firstId);
                const cached = items[0];
                if (cached) {
                    reset(toFormPartial(cached));
                }
            }
            setHasLoadedInitial(true);
        }
    }, [recordsData, reset, hasLoadedInitial]);

    const handleCreate = useCallback(async () => {
        try {
            const created = await createRecord({ publ_id }).unwrap();
            setActiveRecordId(created.id);
            reset(toFormPartial(created));
        } catch {
            // error handled by RTK
        }
    }, [publ_id, createRecord, reset]);

    const records = useMemo(() => recordsData?.items ?? [], [recordsData]);

    const switchToRecord = useCallback(
        async (targetId: string) => {
            if (targetId === activeRecordId) return;

            cancelPendingAutoSave();

            const currentSnapshot = JSON.stringify(getValues());
            if (currentSnapshot !== lastSnapshotRef.current) {
                await save(getValues());
            }

            const cached = records.find((r) => r.id === targetId);
            if (cached) {
                reset(toFormPartial(cached));
            } else {
                const result = await fetchRecordById({ record_id: targetId }, false);
                if (result.data) {
                    reset(toFormPartial(result.data));
                }
            }

            setActiveRecordId(targetId);
        },
        [activeRecordId, save, getValues, reset, fetchRecordById, cancelPendingAutoSave, records],
    );

    const listArgs = useMemo(() => ({ publ_id, user_id: user_id! }) as const, [publ_id, user_id]);

    const deleteActiveRecord = useCallback(async () => {
        if (!activeRecordId) return;

        cancelPendingAutoSave();

        const snapshot = recordsData;

        dispatch(
            recordAPI.util.updateQueryData('recordsList', listArgs, (draft) => {
                draft.items = draft.items.filter((item) => item.id !== activeRecordId);
                draft.total = Math.max(0, draft.total - 1);
            }),
        );

        const currentIdx = records.findIndex((r) => r.id === activeRecordId);
        const remaining = records.filter((r) => r.id !== activeRecordId);
        const nextRecord = remaining[currentIdx] ?? remaining[currentIdx - 1] ?? null;

        try {
            await deleteRecord({ record_id: activeRecordId }).unwrap();

            if (nextRecord) {
                const cached = nextRecord;
                setActiveRecordId(nextRecord.id);
                if (cached) {
                    reset(toFormPartial(cached));
                } else {
                    reset();
                }
            } else {
                setActiveRecordId(null);
                reset();
            }
        } catch {
            if (snapshot) {
                dispatch(
                    recordAPI.util.updateQueryData('recordsList', listArgs, (draft) => {
                        draft.items = snapshot.items;
                        draft.total = snapshot.total;
                    }),
                );
            }
            toast.error('Ошибка при удалении записи');
        }
    }, [
        activeRecordId,
        listArgs,
        records,
        recordsData,
        dispatch,
        deleteRecord,
        cancelPendingAutoSave,
        reset,
    ]);

    const activeStatus = useRecordStatus(
        activeRecordId ?? '',
        !!activeRecordId,
        undefined,
        methods,
    );

    const recordStatuses = useMemo(() => {
        const map: Record<string, RecordStatus> = {};
        for (const record of records) {
            if (record.id === activeRecordId) {
                map[record.id] = activeStatus;
            } else {
                const serverType = record.type;
                map[record.id] = (serverType && SERVER_STATUS_MAP[serverType]) || 'draft';
            }
        }
        return map;
    }, [records, activeRecordId, activeStatus]);

    if (isLoading) return <LoadingScreen />;

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
                    recordStatuses={recordStatuses}
                    onSelectRecord={switchToRecord}
                    onCreateRecord={handleCreate}
                />
                <main className="relative flex w-full min-w-0 flex-1 flex-col">
                    <div className="w-full flex-1 p-4 pb-45 md:p-8 md:pb-30">
                        <div className="mx-auto max-w-6xl space-y-6">
                            {activeRecordId ? (
                                <>
                                    <div className="relative z-20 mb-6 transition-all duration-200 focus-within:z-50">
                                        <ArticleSourceCard publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-15 transition-all duration-200 focus-within:z-50">
                                        <GeographyCard publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-10 transition-all duration-200 focus-within:z-50">
                                        <CollectionEventCard publ_id={publ_id} />
                                    </div>
                                    <div className="relative z-5 transition-all duration-200 focus-within:z-50">
                                        <TaxonomyCard />
                                    </div>
                                    <div className="relative z-0 transition-all duration-200 focus-within:z-50">
                                        <QuantitiesCard />
                                    </div>
                                    <ServerErrorDisplay errors={nonFieldErrors} />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-6 py-24">
                                    <p className="text-lg text-slate-500">Нет записей</p>
                                    <Button onClick={handleCreate} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Создать запись
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <Footer
                        onSave={() => save(getValues())}
                        onSubmit={() => submit(getValues())}
                        onDelete={deleteActiveRecord}
                        isSaving={isSaving}
                        isAutoSaving={isAutoSaving}
                        lastSavedTime={lastSavedTime}
                    />
                </main>
            </SidebarProvider>
        </FormProvider>
    );
};

export default FormFilling;
