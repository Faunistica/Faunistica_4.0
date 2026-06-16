import { type FC, useState, useRef } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useUploadExcelMutation, useDownloadRecordsMutation } from '@/api/recordAPI';
import { getErrorMessage } from '@/lib/error';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    publ_id: number;
}

const ACCEPTED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
];
const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'];

const ExcelUploadModal: FC<Props> = ({ open, onOpenChange, publ_id }) => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadExcel] = useUploadExcelMutation();
    const [downloadRecords, { isLoading: isExporting }] = useDownloadRecordsMutation();

    const isValidFile = (file: File) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
    };

    const handleFileSelect = (file: File) => {
        if (!isValidFile(file)) {
            toast.error(t('excel.invalidFormat'));
            return;
        }
        setSelectedFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
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

        const formData = new FormData();
        formData.append('file', selectedFile);

        const { data: result, error } = await uploadExcel(formData);

        if (error) {
            const message = getErrorMessage(error);
            toast.error(t('excel.importError'), { description: message });
        } else if (result) {
            toast.success(t('excel.importedRecords', { count: result.imported }), { duration: 5000 });

            if (result.errors && result.errors.length > 0) {
                toast.warning(t('excel.importErrors'), {
                    description: t('excel.rowError', { row: result.errors[0].row, error: JSON.stringify(result.errors[0].error) }),
                    duration: 10000,
                });
            }

            setSelectedFile(null);
            onOpenChange(false);
        }

        setIsUploading(false);
    };

    const handleClose = () => {
        if (isUploading) return;
        setSelectedFile(null);
        setShowConfirm(false);
        onOpenChange(false);
    };

    const handleExport = async () => {
        const { error } = await downloadRecords({
            publ_id,
            scope: 'user',
            format: 'xlsx',
        });

        if (error) {
            toast.error(t('excel.downloadError'));
        }
    };

    return (
        <>
            <AlertDialog open={open} onOpenChange={handleClose}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <div className="flex h-fit w-full items-center justify-between gap-4 pb-1">
                            <AlertDialogTitle className="flex items-center gap-2 text-xl">
                                <FileSpreadsheet className="size-5 text-emerald-600" />
                                {t('excel.title')}
                            </AlertDialogTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={isExporting}
                                className="shrink-0 border-emerald-200 text-emerald-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-95"
                            >
                                {isExporting ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 size-4" />
                                )}
                                {t('excel.download')}
                            </Button>
                        </div>
                        <AlertDialogDescription>
                            {t('excel.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200',
                            isDragging
                                ? 'scale-[1.02] border-emerald-400 bg-emerald-50'
                                : selectedFile
                                  ? 'border-emerald-300 bg-emerald-50/50'
                                  : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100',
                        )}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        {selectedFile ? (
                            <>
                                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                                    <FileSpreadsheet className="size-6 text-emerald-600" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-slate-900">
                                        {selectedFile.name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {(selectedFile.size / 1024).toFixed(1)} {t('common.kilobytes')}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                >
                                    <X className="mr-1 size-4" />
                                    {t('excel.removeFile')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex size-12 items-center justify-center rounded-full bg-slate-200">
                                    <Upload className="size-6 text-slate-500" />
                                </div>
                                <div className="text-center">
                                <p className="font-medium text-slate-700">
                                    {t('excel.dragDrop')}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t('excel.clickToSelect')}
                                </p>
                                </div>
                            </>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isUploading}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUploadClick}
                            disabled={!selectedFile || isUploading}
                            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    {t('excel.uploading')}
                                </>
                            ) : (
                                <>
                                    <Upload className="size-4" />
                                    {t('excel.upload')}
                                </>
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-amber-500" />
                            {t('excel.confirmTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('excel.confirmDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowConfirm(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmUpload}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {t('excel.confirmReplace')}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ExcelUploadModal;
