import { type FC } from "react";
import {
    FileText,
    XCircle,
    FileSearch,
    FileDown,
    Calendar,
    User,
    Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import * as Types from '@/types/api.dto';

interface PublicationRowProps {
    pub: Types.Publication;
    mode: "suggested" | "progress" | "available";
}

export const PublicationRow: FC<PublicationRowProps> = ({ pub, mode }) => {
    return (
        <div
            className={`
        group relative flex flex-col lg:flex-row gap-4 p-4 sm:p-5
        bg-white rounded-xl border border-slate-200/70 shadow-sm
        hover:shadow-md hover:border-slate-300/80 transition-all duration-200
        ${mode === "suggested" ? "bg-amber-50/30 hover:bg-amber-50/50" : ""}
      `}
        >
            {/* Левая цветная полоса-индикатор (опционально для разграничения режимов) */}
            <div
                className={`
          absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-colors
          ${mode === "suggested" ? "bg-amber-400" : ""}
          ${mode === "progress" ? "bg-blue-400" : ""}
          ${mode === "available" ? "bg-emerald-400" : ""}
        `}
            />

            {/* Блок с метаданными */}
            <div className="flex-1 min-w-0 space-y-2 w-full pl-1">
                {/* Строка с ID и бейджами */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
                        <Hash className="h-3 w-3" />
                        {pub.publ_id}
                    </span>

                    {pub.type && (
                        <Badge
                            variant="outline"
                            className="h-5 rounded-full text-[10px] px-2.5 font-medium bg-white border-slate-300 text-slate-700"
                        >
                            {pub.type}
                        </Badge>
                    )}
                    {pub.language && (
                        <Badge className="h-5 rounded-full text-[10px] px-2.5 font-medium bg-slate-100 text-slate-700">
                            {pub.language}
                        </Badge>
                    )}
                    {pub.ural && (
                        <Badge className="h-5 rounded-full text-[10px] px-2.5 font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Урал
                        </Badge>
                    )}
                </div>

                {/* Название публикации */}
                <h4
                    className="text-sm md:text-base font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-slate-900 transition-colors"
                    title={pub.name || "Без названия"}
                >
                    {pub.name || "Название публикации отсутствует"}
                </h4>

                {/* Автор и год — с иконками для лучшего считывания */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {pub.author || "Автор неизвестен"}
                    </span>
                    {pub.year && (
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {pub.year}
                        </span>
                    )}
                </div>
            </div>

            {/* Блок управления (кнопки) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto mt-1 lg:mt-0">
                {/* Кнопка PDF — теперь с иконкой загрузки, если файл есть */}
                <Button
                    variant="outline"
                    size="sm"
                    className={`
            h-9 rounded-lg gap-2 border transition-all w-full sm:w-auto justify-center
            ${pub.pdf_file
                            ? "border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
                            : "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50/50"
                        }
          `}
                    disabled={!pub.pdf_file}
                    asChild={!!pub.pdf_file}
                >
                    {pub.pdf_file ? (
                        <a href={pub.pdf_file} target="_blank" rel="noopener noreferrer">
                            <FileDown className="h-4 w-4" />
                            <span>PDF</span>
                        </a>
                    ) : (
                        <>
                            <FileText className="h-4 w-4" />
                            <span>Нет PDF</span>
                        </>
                    )}
                </Button>

                {/* Режим «suggested» */}
                {mode === "suggested" && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 rounded-lg gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto justify-center"
                        >
                            <XCircle className="h-4 w-4" />
                            <span>Отказаться</span>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            className="h-9 rounded-lg gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto justify-center shadow-sm shadow-amber-200/50"
                        >
                            <Link to={`/publication/${pub.publ_id}`}>
                                <FileSearch className="h-4 w-4" />
                                <span>Взять в работу</span>
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Будущие режимы — аналогично улучшенные стили (раскомментировать при необходимости) */}
                {/*
        {mode === "progress" && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto justify-center"
            >
              <XCircle className="h-4 w-4" />
              <span>Отказаться</span>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-9 rounded-lg gap-2 bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto justify-center shadow-sm"
            >
              <Link to={`/publication/${pub.id}`}>
                <BookOpen className="h-4 w-4" />
                <span>Продолжить</span>
              </Link>
            </Button>
          </div>
        )}

        {mode === "available" && (
          <Button
            size="sm"
            className="h-9 rounded-lg gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto justify-center shadow-sm shadow-emerald-200/50"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Забронировать</span>
          </Button>
        )}
        */}
            </div>
        </div>
    );
};