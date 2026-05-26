import { type FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Save, Send, Trash2, Cloud, CloudOff, Check, Loader2 } from 'lucide-react';

interface FooterProps {
    onSave: () => void;
    onSubmit: () => void;
    onDelete: () => void;
    isSaving: boolean;
    isAutoSaving: boolean;
    lastSavedTime: Date | null;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

const Footer: FC<FooterProps> = ({
    onSave,
    onSubmit,
    onDelete,
    isSaving,
    isAutoSaving,
    lastSavedTime,
}) => {
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <>
            <footer className="fixed right-0 bottom-0 left-0 z-90 flex flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md md:left-64 md:px-10">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={isSaving}
                        variant="destructive"
                        className="gap-2"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Удалить</span>
                    </Button>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        {isAutoSaving ? (
                            <>
                                <Cloud className="h-3.5 w-3.5 animate-pulse text-blue-500" />
                                <span>Автосохранение...</span>
                            </>
                        ) : lastSavedTime ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Сохранено в {formatTime(lastSavedTime)}</span>
                            </>
                        ) : (
                            <>
                                <CloudOff className="h-3.5 w-3.5 text-slate-400" />
                                <span>Не сохранено</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={onSave}
                        disabled={isSaving || isAutoSaving}
                        variant="outline"
                        className="gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Сохранить
                    </Button>
                    <Button
                        onClick={() => setIsSubmitDialogOpen(true)}
                        disabled={isSaving}
                        className="gap-2 bg-slate-900 font-semibold text-white hover:bg-slate-800"
                    >
                        <Send className="h-4 w-4" />
                        Отправить
                    </Button>
                </div>
            </footer>

            <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Подтвердить отправку?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы уверены, что хотите отправить данные? После подтверждения эти данные
                            уйдут в базу, и это действие нельзя будет отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsSubmitDialogOpen(false)}
                            disabled={isSaving}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                onSubmit();
                                setIsSubmitDialogOpen(false);
                            }}
                            disabled={isSaving}
                            className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                            {isSaving ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Подтвердить удаление?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы уверены, что хотите удалить эту запись? Это действие нельзя будет
                            отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isSaving}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                onDelete();
                                setIsDeleteDialogOpen(false);
                            }}
                            disabled={isSaving}
                            variant="destructive"
                        >
                            Удалить
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default Footer;
