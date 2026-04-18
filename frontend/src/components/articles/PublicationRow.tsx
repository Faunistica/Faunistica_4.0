import { type FC } from "react";
import { Users, CheckCircle2, FileText, XCircle, FileSearch, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";

export interface Publication {
    publ_id: number;
    type: string;
    author: string;
    year: number;
    name: string;
    language: string;
    ural: boolean;
    pdf_file: string;
    bookedBy?: number;
    processedBy?: number;
}

interface PublicationRowProps {
    pub: Publication;
    mode: 'suggested' | 'progress' | 'available';
}

export const PublicationRow: FC<PublicationRowProps> = ({ pub, mode }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col lg:flex-row gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors items-start lg:items-center">

            {/* Метаданные */}
            <div className="flex-1 min-w-0 space-y-2 lg:space-y-1 w-full">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">#{pub.publ_id}</span>
                    <Badge variant="outline" className="h-5 rounded-md text-[10px] px-2 font-semibold bg-white">{pub.type}</Badge>
                    {pub.language && <Badge variant="secondary" className="h-5 rounded-md text-[10px] px-2">{pub.language}</Badge>}
                    {pub.ural && <Badge variant="outline" className="h-5 rounded-md text-[10px] px-2 border-blue-200 text-blue-700 bg-blue-50">Урал</Badge>}
                </div>
                <h4 className="text-sm md:text-base font-semibold text-slate-900 leading-snug line-clamp-2" title={pub.name}>
                    {pub.name}
                </h4>
                <p className="text-xs md:text-sm text-slate-600 truncate">
                    {pub.author} ({pub.year})
                </p>
            </div>

            {/* Статистика (только для доступных) */}
            {mode === 'available' && (
                <div className="flex lg:flex-col gap-4 lg:gap-1 text-xs text-slate-500 shrink-0 w-full lg:w-32 py-2 lg:py-0 border-y lg:border-none border-slate-100">
                    <span className="flex items-center gap-1.5" title="В процессе обработки">
                        <Users className="h-3.5 w-3.5" /> В работе: {pub.bookedBy}
                    </span>
                    <span className="flex items-center gap-1.5" title="Успешно обработано">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Завершено: {pub.processedBy}
                    </span>
                </div>
            )}

            {/* Панель управления (адаптивная сетка для мобильных) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full lg:w-auto mt-2 lg:mt-0">

                {/* Кнопка PDF доступна всегда */}
                <Button variant="outline" size="sm" className="h-9 rounded-md gap-2 text-slate-600 border-slate-300 w-full sm:w-auto justify-center">
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                </Button>

                {mode === 'suggested' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button variant="ghost" size="sm" className="h-9 rounded-md gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto justify-center">
                            <XCircle className="h-4 w-4" />
                            <span>Отказаться</span>
                        </Button>
                        <Button onClick={() => navigate(`/article/${pub.publ_id}`)} size="sm" className="h-9 rounded-md gap-2 bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto justify-center shadow-sm">
                            <FileSearch className="h-4 w-4" />
                            <span>Взять в работу</span>
                        </Button>
                    </div>
                )}

                {mode === 'progress' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button variant="ghost" size="sm" className="h-9 rounded-md gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto justify-center">
                            <XCircle className="h-4 w-4" />
                            <span>Отказаться</span>
                        </Button>
                        <Button onClick={() => navigate(`/article/${pub.publ_id}`)} size="sm" className="h-9 rounded-md gap-2 bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto justify-center shadow-sm">
                            <BookOpen className="h-4 w-4" />
                            <span>Продолжить</span>
                        </Button>
                    </div>
                )}

                {mode === 'available' && (
                    <Button size="sm" className="h-9 rounded-md gap-2 bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto justify-center shadow-sm">
                        <ArrowRight className="h-4 w-4" />
                        <span>Забронировать</span>
                    </Button>
                )}
            </div>
        </div>
    );
}