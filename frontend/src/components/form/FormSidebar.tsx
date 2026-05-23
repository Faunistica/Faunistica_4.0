// src/components/form/FormSidebar.tsx
import { type FC, memo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, FileText, Trash2, MapPin, X, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RecordStatusIndicator } from '@/components/sidebar/RecordStatusIndicator';
import ExcelUploadModal from '@/components/form/ExcelUploadModal';
import type { FormSchema } from '@/types/forms';

interface SidebarProps {
    activeRecordIndex: number;
    setActiveRecordIndex: (index: number) => void;
    addRecord: () => void;
    removeRecord: (index: number) => void;
    onImportComplete: () => void;
    samplesCount: number;
    validationErrors: Map<number, string[]>;
}

// 🔒 Memoized list item — обновляется только при изменении своего индекса
const SidebarRecordItem = memo(
    ({
        index,
        isActive,
        onSelect,
        onDelete,
        validationErrors,
    }: {
        index: number;
        isActive: boolean;
        onSelect: () => void;
        onDelete: () => void;
        validationErrors: Map<number, string[]>;
    }) => {
        const { control } = useFormContext<FormSchema>();
        const [
            species,
            genus,
            family,
            locality,
            region,
            type,
            sampleErrors
        ] = useWatch({
            control,
            name: [
                `samples.${index}.species`,
                `samples.${index}.genus`,
                `samples.${index}.family`,
                `samples.${index}.locality`,
                `samples.${index}.region`,
                `samples.${index}.type`,
                `samples.${index}.errors`
            ] as any
        });

        const recordName = species || genus || family || 'Новая запись';

        // Mock sample object for RecordStatusIndicator which expects a partial sample
        const sampleMock = { type, errors: sampleErrors };

        return (
            <SidebarMenuItem>
                <div
                    role="button"
                    tabIndex={0}
                    data-active={isActive}
                    onClick={onSelect}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect();
                        }
                    }}
                    className={`group/menu-button flex w-full cursor-pointer flex-col items-start gap-2 rounded-md px-3 py-3 text-left transition-all duration-200 ${
                        isActive
                            ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200'
                            : 'hover:bg-slate-50'
                    }`}
                >
                    {/* Заголовок: номер + название + статус + удалить */}
                    <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <RecordStatusIndicator
                                index={index}
                                sample={sampleMock}
                                validationErrors={validationErrors}
                            />
                            <span
                                className={`text-xs font-bold leading-tight truncate ${
                                    isActive ? 'text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {recordName}
                            </span>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 rounded-md text-slate-400 opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 md:opacity-0 md:group-hover/menu-button:opacity-100 md:data-[active=true]:opacity-100 data-[active=true]:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Удалить запись"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие нельзя отменить. Запись будет безвозвратно
                                        удалена.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                        Отмена
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        variant="destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                    >
                                        Удалить
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* Подпись: локация или статус редактирования */}
                    <div className="flex w-full items-center gap-1.5 text-[10px] text-slate-500">
                        {isActive ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                                </span>
                                <span className="font-semibold text-blue-600">Редактируется</span>
                            </>
                        ) : (
                            <>
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                    {locality || region || 'Нет данных о месте'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </SidebarMenuItem>
        );
    },
);
SidebarRecordItem.displayName = 'SidebarRecordItem';

const FormSidebar: FC<SidebarProps> = ({
    activeRecordIndex,
    setActiveRecordIndex,
    addRecord,
    removeRecord,
    onImportComplete,
    samplesCount,
    validationErrors,
}) => {
    const { isMobile, setOpenMobile } = useSidebar();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <>
            <Sidebar variant="sidebar" className="border-r border-slate-200">
                <SidebarHeader className="border-b border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-sm font-bold leading-tight text-slate-900">
                                    Менеджер
                                </div>
                                <div className="text-[10px] font-medium leading-tight text-slate-500">
                                    Записи данных
                                </div>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 md:hidden"
                            onClick={() => setOpenMobile(false)}
                            aria-label="Закрыть панель"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <div className="p-4 pb-0 space-y-2">
                        <Button
                            type="button"
                            onClick={addRecord}
                            className="w-full gap-2 bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800"
                            size="sm"
                        >
                            <Plus className="h-4 w-4" />
                            Добавить запись
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsUploadOpen(true)}
                            className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            size="sm"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Работа с Excel
                        </Button>
                    </div>

                    <SidebarGroup className="mt-2">
                        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Список записей
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1.5 px-2">
                                {Array.from({ length: samplesCount }).map((_, index) => {
                                    return (
                                        <SidebarRecordItem
                                            key={index}
                                            index={index}
                                            isActive={index === activeRecordIndex}
                                            onSelect={() => {
                                                setActiveRecordIndex(index);
                                                if (isMobile) setOpenMobile(false);
                                            }}
                                            onDelete={() => removeRecord(index)}
                                            validationErrors={validationErrors}
                                        />
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="border-t border-slate-100 p-4">
                    <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start gap-2 shadow-sm font-medium"
                    >
                        <Link to="/dashboard">
                            <LogOut className="h-4 w-4 text-slate-500" />
                            Вернуться назад
                        </Link>
                    </Button>
                </SidebarFooter>
            </Sidebar>

            <ExcelUploadModal
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                onImportComplete={onImportComplete}
            />
        </>
    );
};

export default FormSidebar;
