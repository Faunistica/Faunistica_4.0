import { type FC, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { FormSchema } from '@/types/forms';

interface FooterProps {
    handleSave: (data: FormSchema, isManual: boolean, targetIndex?: number) => Promise<void>;
    onSaveAll: () => void;
    onValidateAll: () => void;
    onSubmit: () => Promise<boolean>;
    isValidating: boolean;
}

const ENABLE_MOTION_ON_DESKTOP = true;

const Footer: FC<FooterProps> = ({
    handleSave,
    onSaveAll,
    onValidateAll,
    onSubmit,
    isValidating,
}) => {
    const methods = useFormContext<FormSchema>();
    const {
        formState: { isValid },
    } = methods;

    const { isAutoSaving, lastSavedTime } = useAutoSave({
        methods,
        handleSave,
    });
    const [isHidden, setIsHidden] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    // Состояния для диалога отправки
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', (latest) => {
        if (!ENABLE_MOTION_ON_DESKTOP && isDesktop) {
            setIsHidden(false);
            return;
        }

        const previous = scrollY.getPrevious() ?? 0;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const isAtBottom = scrollHeight - clientHeight - latest <= 20;

        if (isAtBottom || latest <= 10) {
            setIsHidden(false);
        } else if (latest > previous && latest > 50) {
            setIsHidden(true);
        } else if (latest < previous) {
            setIsHidden(false);
        }
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const success = await onSubmit();
            if (success) {
                setIsDialogOpen(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const shouldAnimate = ENABLE_MOTION_ON_DESKTOP ? isHidden : !isDesktop && isHidden;

    return (
        <>
            <motion.footer
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: '100%', opacity: 0 },
                }}
                animate={shouldAnimate ? 'hidden' : 'visible'}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/95 backdrop-blur-md px-4 md:px-10 py-4 border-t border-slate-200 z-[90] flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
            >
                <div className="flex items-center gap-3 text-sm text-slate-500 order-2 md:order-1 w-full md:w-auto justify-center md:justify-start">
                    <span
                        className={`flex h-2.5 w-2.5 rounded-full ${isAutoSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
                    ></span>
                    <span className="font-medium">
                        {isAutoSaving
                            ? 'Сохранение...'
                            : lastSavedTime
                              ? `Последнее сохранение: ${lastSavedTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Ожидание изменений...'}
                    </span>
                </div>

                <div className="flex w-full md:w-auto gap-3 order-1 md:order-2">
                    {/* Проверить всё */}
                    <Button
                        onClick={onValidateAll}
                        disabled={isValidating}
                        className="flex-1 md:flex-none md:px-5 font-semibold border-amber-300 text-amber-700 hover:bg-amber-50 transition-all"
                        variant="outline"
                    >
                        <CheckCheck className="h-4 w-4 mr-1.5" />
                        {isValidating ? 'Проверка...' : 'Проверить всё'}
                    </Button>

                    {/* Сохранить всё */}
                    {/* <Button
                        onClick={onSaveAll}
                        disabled={isAutoSaving}
                        className="flex-1 md:flex-none md:px-5 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
                        variant="outline"
                    >
                        <ShieldCheck className="h-4 w-4 mr-1.5" />
                        {isAutoSaving ? "Сохранение..." : "Сохранить всё"}
                    </Button> */}

                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="flex-1 md:flex-none bg-slate-900 text-white hover:bg-slate-800 md:px-8 font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Отправить данные
                    </Button>
                </div>
            </motion.footer>

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
                            disabled={isSubmitting}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isValid}
                            className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                            {isSubmitting ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default Footer;
