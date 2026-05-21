// src/components/form/ExcelUploadModal.tsx
import { type FC, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, X, AlertTriangle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useImportRecordsMutation, useExportRecordsMutation } from '@/api/recordAPI';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import type { RootState } from '@/store/store';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete: () => void;
}

const ACCEPTED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
];
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

const ExcelUploadModal: FC<Props> = ({ open, onOpenChange, onImportComplete }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importRecords] = useImportRecordsMutation();
    const [exportRecords, { isLoading: isExporting }] = useExportRecordsMutation();

    const user_id = useSelector((state: RootState) => state.user.user_id);
    const { id } = useParams<{ id: string }>();
    const publ_id = Number(id);

    const isValidFile = (file: File) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
    };

    const handleFileSelect = (file: File) => {
        if (!isValidFile(file)) {
            toast.error('Неверный формат файла. Поддерживаются .xlsx, .xls и .csv');
            return;
        }
        setSelectedFile(file);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        // Reset so same file can be re-selected
        e.target.value = '';
    };

    const handleUploadClick = () => {
        if (!selectedFile) return;
        setShowConfirm(true);
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile) return;
        setShowConfirm(false);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const result = await importRecords(formData).unwrap();

            // Show success toast
            toast.success(`Загружено ${result.imported_count} записей`, {
                duration: 5000,
            });

            // Show errors/warnings if any
            if (result.errors && result.errors.length > 0) {
                toast.warning('Обнаружены ошибки при импорте', {
                    description: result.errors.slice(0, 5).join('\n'),
                    duration: 10000,
                });
            }
            if (result.warnings && result.warnings.length > 0) {
                toast.info('Предупреждения', {
                    description: result.warnings.slice(0, 5).join('\n'),
                    duration: 8000,
                });
            }

            setSelectedFile(null);
            onOpenChange(false);
            onImportComplete();
        } catch (error: any) {
            const message = error?.data?.detail || error?.message || 'Неизвестная ошибка';
            toast.error('Ошибка при загрузке файла', {
                description: String(message),
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (isUploading) return;
        setSelectedFile(null);
        setShowConfirm(false);
        onOpenChange(false);
    };

    const handleExport = async () => {
        if (!user_id) return;
        try {
            const blob = await exportRecords({
                user_id,
                publ_id,
                scope: 'user',
                format: 'xlsx',
            }).unwrap();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `records_export_${publ_id || 'all'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Файл успешно скачан');
        } catch (error) {
            toast.error('Ошибка при скачивании файла');
            console.error(error);
        }
    };

    return (
        <>
            <AlertDialog open={open} onOpenChange={handleClose}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <div className="flex w-full items-center justify-between gap-4">
                            <AlertDialogTitle className="flex items-center gap-2 text-xl">
                                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                Работа с Excel
                            </AlertDialogTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={isExporting}
                                className="shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm transition-all active:scale-95"
                            >
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Скачать XLSX
                            </Button>
                        </div>
                        <AlertDialogDescription>
                            Загрузите файл Excel (.xlsx) или CSV (.csv) с данными записей или
                            скачайте текущие.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Drop zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative cursor-pointer rounded-xl border-2 border-dashed p-8
                            transition-all duration-200 flex flex-col items-center gap-3
                            ${
                                isDragging
                                    ? 'border-emerald-400 bg-emerald-50 scale-[1.02]'
                                    : selectedFile
                                      ? 'border-emerald-300 bg-emerald-50/50'
                                      : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                            }
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        {selectedFile ? (
                            <>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                    <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-slate-900">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {(selectedFile.size / 1024).toFixed(1)} КБ
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Убрать файл
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                                    <Upload className="h-6 w-6 text-slate-500" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-slate-700">
                                        Перетащите файл сюда
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        или нажмите для выбора • .xlsx, .csv
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                            Отмена
                        </Button>
                        <Button
                            onClick={handleUploadClick}
                            disabled={!selectedFile || isUploading}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Загрузка...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    Загрузить
                                </>
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirmation dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Подтверждение импорта
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Все текущие записи будут удалены и заменены данными из Excel.
                            Продолжить?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirm(false)}>
                            Отмена
                        </Button>
                        <Button
                            onClick={handleConfirmUpload}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Да, заменить все данные
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ExcelUploadModal;
