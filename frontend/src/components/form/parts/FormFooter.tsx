import { type FC, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { Send, Trash2, Cloud, CloudOff, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRecordForm } from '@/hooks/useRecordForm';

function formatTime(date: Date): string {
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

const ENABLE_MOTION_ON_DESKTOP = false;

const Footer: FC = () => {
    const {
        state: { lastSavedTime, activeRecordId, isAutoSaving, isBusy },
        actions,
    } = useRecordForm();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    const mobile = useIsMobile();

    const lastScrollDownY = useRef(0);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', (latest) => {
        if (!ENABLE_MOTION_ON_DESKTOP && !mobile) {
            setIsHidden(false);
            return;
        }

        const prev = scrollY.getPrevious() ?? 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const distFromBottom = maxScroll - latest;
        const isNearTop = latest <= 10;
        const isNearBottom = distFromBottom <= 80;
        const scrollingDown = latest > prev;

        if (isNearTop || isNearBottom) {
            setIsHidden(false);
            return;
        }

        if (scrollingDown && latest > 50) {
            setIsHidden(true);
            lastScrollDownY.current = latest;
            return;
        }

        if (isHidden && !scrollingDown && latest < lastScrollDownY.current - 30) {
            setIsHidden(false);
        }
    });

    const animateMotion = ENABLE_MOTION_ON_DESKTOP || mobile;

    return (
        <>
            <motion.footer
                variants={{
                    visible: { y: 0 },
                    hidden: { y: '100%' },
                }}
                animate={animateMotion && isHidden ? 'hidden' : 'visible'}
                inert={isHidden}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed inset-x-0 bottom-0 z-100 flex flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md md:left-64 md:px-10"
            >
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={isBusy}
                        variant="destructive"
                        className="hidden gap-2 text-xs md:inline-flex"
                    >
                        <Trash2 className="size-4" />
                        Удалить
                    </Button>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        {isAutoSaving ? (
                            <>
                                <Cloud className="size-4 animate-pulse text-blue-500" />
                                <span>Автосохранение...</span>
                            </>
                        ) : lastSavedTime ? (
                            <>
                                <Check className="size-4 text-emerald-500" />
                                <span>Сохранено в {formatTime(lastSavedTime)}</span>
                            </>
                        ) : (
                            <>
                                <CloudOff className="size-4 text-slate-400" />
                                <span>Не сохранено</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="submit"
                        disabled={isBusy}
                        className="gap-2 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                        <Send className="size-4" />
                        Отправить
                    </Button>
                </div>
            </motion.footer>

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
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isBusy}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                void actions.deleteRecord(activeRecordId!);
                                setIsDeleteDialogOpen(false);
                            }}
                            disabled={isBusy || activeRecordId === null}
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
