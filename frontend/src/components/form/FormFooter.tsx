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
import { Save, Send, Cloud, CloudOff, Check } from 'lucide-react';

interface FooterProps {
    onSave: () => void;
    onSubmit: () => void;
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

const Footer: FC<FooterProps> = ({ onSave, onSubmit, isSaving, isAutoSaving, lastSavedTime }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <footer className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/95 backdrop-blur-md px-4 md:px-10 py-4 border-t border-slate-200 z-[90] flex flex-row items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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

                <div className="flex items-center gap-3">
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        variant="outline"
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={isSaving}
                        className="gap-2 bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                    >
                        <Send className="h-4 w-4" />
                        Отправить
                    </Button>
                </div>
            </footer>

            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSaving}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                onSubmit();
                                setIsDialogOpen(false);
                            }}
                            disabled={isSaving}
                            className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                            {isSaving ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default Footer;
