import { type FC } from 'react';
import { FileText, XCircle, FileSearch, FileDown, Calendar, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router';
import * as Types from '@/types/api.dto';

interface PublicationRowProps {
    pub: Types.Publication;
    mode: 'suggested' | 'progress' | 'available';
}

export const PublicationRow: FC<PublicationRowProps> = ({ pub, mode }) => {
    return (
        <div
            className={cn(
                'group relative flex flex-col gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300/80 hover:shadow-md sm:p-5 lg:flex-row',
                mode === 'suggested' && 'bg-amber-50/30 hover:bg-amber-50/50',
            )}
        >
            {/* Левая цветная полоса-индикатор (опционально для разграничения режимов) */}
            <div
                className={cn(
                    'absolute inset-y-0 left-0 w-1 rounded-l-xl transition-colors',
                    mode === 'suggested' && 'bg-amber-400',
                    mode === 'progress' && 'bg-blue-400',
                    mode === 'available' && 'bg-emerald-400',
                )}
            />

            {/* Блок с метаданными */}
            <div className="w-full min-w-0 flex-1 space-y-2 pl-1">
                {/* Строка с ID и бейджами */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-500">
                        <Hash className="size-3" />
                        {pub.publ_id}
                    </span>

                    {pub.type && (
                        <Badge
                            variant="outline"
                            className="h-5 rounded-full border-slate-300 bg-white px-2.5 text-[10px] font-medium text-slate-700"
                        >
                            {pub.type}
                        </Badge>
                    )}
                    {pub.language && (
                        <Badge className="h-5 rounded-full bg-slate-100 px-2.5 text-[10px] font-medium text-slate-700">
                            {pub.language}
                        </Badge>
                    )}
                    {pub.ural && (
                        <Badge className="h-5 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-[10px] font-medium text-blue-700">
                            Урал
                        </Badge>
                    )}
                </div>

                {/* Название публикации */}
                <h4
                    className="line-clamp-2 text-sm/snug font-semibold text-slate-800 transition-colors group-hover:text-slate-900 md:text-base"
                    title={pub.name || 'Без названия'}
                >
                    {pub.name || 'Название публикации отсутствует'}
                </h4>

                {/* Автор и год — с иконками для лучшего считывания */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                        <User className="size-3.5 text-slate-400" />
                        {pub.author || 'Автор неизвестен'}
                    </span>
                    {pub.year && (
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5 text-slate-400" />
                            {pub.year}
                        </span>
                    )}
                </div>
            </div>

            {/* Блок управления (кнопки) */}
            <div className="mt-1 flex w-full shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center lg:mt-0 lg:w-auto">
                {/* Кнопка PDF — теперь с иконкой загрузки, если файл есть */}
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-9 w-full justify-center gap-2 rounded-lg border transition-all sm:w-auto',
                        pub.pdf_file
                            ? 'border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                            : 'cursor-not-allowed border-slate-200 bg-slate-50/50 text-slate-400',
                    )}
                    disabled={!pub.pdf_file}
                    asChild={!!pub.pdf_file}
                >
                    {pub.pdf_file ? (
                        <a href={pub.pdf_file} target="_blank" rel="noopener noreferrer">
                            <FileDown className="size-4" />
                            <span>PDF</span>
                        </a>
                    ) : (
                        <>
                            <FileText className="size-4" />
                            <span>Нет PDF</span>
                        </>
                    )}
                </Button>

                {/* Режим «suggested» */}
                {mode === 'suggested' && (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 w-full justify-center gap-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                        >
                            <XCircle className="size-4" />
                            <span>Отказаться</span>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            className="h-9 w-full justify-center gap-2 rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-200/50 hover:bg-amber-600 sm:w-auto"
                        >
                            <Link to={`/publication/${pub.publ_id}`}>
                                <FileSearch className="size-4" />
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
