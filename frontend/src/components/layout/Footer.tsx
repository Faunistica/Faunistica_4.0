import { type FC } from "react";
import { Button } from "@/components/ui/button";

const Footer: FC = () => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md px-4 md:px-10 py-4 border-t border-slate-200 z-40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 text-sm text-slate-500 order-2 md:order-1 w-full md:w-auto justify-center md:justify-start">
                <span className="flex h-2.5 w-2.5 rounded-full bg-slate-900 animate-pulse"></span>
                <span className="font-medium">Автосохранение: 14:32</span>
            </div>
            <div className="flex w-full md:w-auto gap-3 order-1 md:order-2">
                <Button
                    variant="outline"
                    className="flex-1 md:flex-none md:px-6 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                    Сохранить черновик
                </Button>
                <Button
                    className="flex-1 md:flex-none bg-slate-900 text-white hover:bg-slate-800 md:px-8 font-bold shadow-md hover:shadow-lg transition-all"
                >
                    Отправить данные
                </Button>
            </div>
        </footer>
    );
};

export default Footer;
