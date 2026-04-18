import { type FC } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, X, MoreHorizontal, Trash2 } from 'lucide-react';
import type { InsertRecordsRequest } from "@/types/api.dto";
import { useNavigate } from "react-router";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    samples?: Partial<InsertRecordsRequest>[];
    activeSampleIndex?: number;
    setActiveSampleIndex?: (index: number) => void;
    addSample?: () => void;
    removeSample?: (index: number) => void;
}

const Sidebar: FC<SidebarProps> = ({
    isOpen,
    setIsOpen,
    samples = [],
    activeSampleIndex = 0,
    setActiveSampleIndex,
    addSample,
    removeSample
}) => {
    const navigate = useNavigate();

    return (
        <>
            {/* Мобильный оверлей */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Боковая панель */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col
                lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:shadow-none lg:z-30
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
                    <div>
                        <div className="text-lg font-bold text-slate-900">Менеджер образцов</div>
                        {/* <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Текущая сессия</div> */}
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(false)}>
                        <X className="h-5 w-5 text-slate-500" />
                    </Button>
                </div>

                <div className="p-4">
                    <Button onClick={addSample} className="w-full gap-2 font-semibold shadow-sm bg-slate-900 hover:bg-slate-800 text-white">
                        <Plus className="h-4 w-4" />
                        Добавить образец
                    </Button>
                </div>

                <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
                    <div className="py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Созданные записи</div>

                    {samples.map((sample, index) => {
                        const isActive = index === activeSampleIndex;
                        const sampleName = sample.species || sample.genus || sample.family || "Новый образец";

                        return (
                            <div
                                key={index}
                                onClick={() => setActiveSampleIndex?.(index)}
                                className={`group flex flex-col rounded-lg border-2 ${isActive ? 'border-slate-900 bg-slate-100/50' : 'border-transparent hover:bg-slate-100 cursor-pointer'} p-3 transition-all relative`}
                            >
                                <div className="pr-10">
                                    <span className={`block text-xs font-bold ${isActive ? 'text-slate-900' : 'text-slate-700 font-medium'}`}>
                                        Образец #{index + 1}: {sampleName}
                                    </span>
                                    {isActive ? (
                                        <span className="block text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                            Редактируется...
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-slate-500 mt-0.5 max-h-3 overflow-hidden">
                                            {sample.place || sample.region || "Нет данных"}
                                        </span>
                                    )}
                                </div>
                                <div className={`absolute top-2 right-2 flex flex-col gap-1 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} lg:opacity-0 lg:group-hover:opacity-100 transition-opacity`}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-900">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeSample?.(index);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="mt-auto border-t border-slate-200 p-4 bg-slate-50/50">
                    <Button onClick={() => {
                        navigate('/dashboard');
                        window.scrollTo(0, 0);
                    }} variant="ghost" className="w-full justify-start gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50">
                        <LogOut className="h-4 w-4" />
                        Назад
                    </Button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
