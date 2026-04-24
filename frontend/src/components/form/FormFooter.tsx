import { type FC, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const ENABLE_MOTION_ON_DESKTOP = true;

const Footer: FC = () => {
    const navigate = useNavigate();
    const [isHidden, setIsHidden] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    const [isDraftSaving, setIsDraftSaving] = useState(false);
    const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
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

    const handleSaveDraft = () => {
        setIsDraftSaving(true);

        setTimeout(() => {
            setIsDraftSaving(false);
            const now = new Date();
            setDraftSavedTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
        }, 1500);
    };
    const handleConfirmSubmit = () => {
        navigate("/dashboard", { state: { showSuccessAlert: true } });
    };

    const shouldAnimate = ENABLE_MOTION_ON_DESKTOP ? isHidden : (!isDesktop && isHidden);

    return (
        <motion.footer
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: "100%", opacity: 0 },
            }}
            animate={shouldAnimate ? "hidden" : "visible"}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md px-4 md:px-10 py-4 border-t border-slate-200 z-40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        >
            <div className="flex items-center gap-3 text-sm text-slate-500 order-2 md:order-1 w-full md:w-auto justify-center md:justify-start">
                <span className="flex h-2.5 w-2.5 rounded-full bg-slate-900 animate-pulse"></span>
                <span className="font-medium">
                    {draftSavedTime ? `Последнее сохранение: ${draftSavedTime}` : "Автосохранение: 14:32"}
                </span>
            </div>

            <div className="flex w-full md:w-auto gap-3 order-1 md:order-2">
                <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isDraftSaving}
                    className="flex-1 md:flex-none md:px-6 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 transition-all w-48"
                >
                    {isDraftSaving ? (
                        "Сохранение..."
                    ) : (
                        "Сохранить черновик"
                    )}
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            className="flex-1 md:flex-none bg-slate-900 text-white hover:bg-slate-800 md:px-8 font-bold shadow-md hover:shadow-lg transition-all"
                        >
                            Отправить данные
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Подтвердить отправку?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Вы уверены, что хотите отправить данные? После подтверждения эти данные уйдут в базу, и это действие нельзя будет отменить.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-slate-900 text-white hover:bg-slate-800">
                                Отправить
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </motion.footer>
    );
};

export default Footer;