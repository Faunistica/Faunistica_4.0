import { type FC } from 'react';
import { FileText, FileDown, Calendar, User, Hash, BookOpen, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router';
import * as Types from '@/types/api.dto';
import { Card, CardHeader, CardTitle } from '../ui/card';

interface PublicationRowProps {
    publication: Types.Publication;
    mode: 'progress' | 'available';
}

export const PublicationRow: FC<PublicationRowProps> = ({ publication, mode }) => {
    return (
        <Card className="relative mb-4 p-4 shadow-sm transition-all duration-200 hover:border-slate-300/80 hover:shadow-md sm:p-5 lg:flex-row">
            {/* Левая цветная полоса-индикатор (опционально для разграничения режимов) */}
            <div
                className={cn(
                    'pointer-events-none absolute inset-0 rounded-xl border-l-3',
                    mode === 'progress' && 'border-blue-400',
                    mode === 'available' && 'border-emerald-400',
                )}
            />

            {/* Блок с метаданными */}
            <CardHeader className="w-full min-w-0 flex-1 pl-1">
                {/* Строка с ID и бейджами */}
                <div className="flex flex-wrap items-center gap-2">
                    {publication.ural && (
                        <Badge className="h-5 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-[10px] font-medium text-blue-700">
                            Урал
                        </Badge>
                    )}
                    {publication.language && (
                        <Badge className="h-5 rounded-full bg-slate-100 px-2.5 text-[10px] font-medium text-slate-700">
                            {publication.language}
                        </Badge>
                    )}
                </div>

                <CardTitle
                    className="line-clamp-2 text-sm/snug font-semibold text-slate-800 transition-colors group-hover:text-slate-900 md:text-base"
                    title={publication.name || 'Без названия'}
                >
                    {publication.name || 'Название публикации отсутствует'}
                </CardTitle>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                        <Hash className="size-3.5 text-slate-400" />
                        {publication.publ_id}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <User className="size-3.5 text-slate-400" />
                        {publication.author || 'Автор неизвестен'}
                    </span>
                    {publication.year && (
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5 text-slate-400" />
                            {publication.year}
                        </span>
                    )}
                </div>
            </CardHeader>

            <div className="mt-1 flex w-full shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center lg:mt-0 lg:w-auto">
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-9 w-full justify-center gap-2 rounded-lg border transition-all sm:w-auto',
                        publication.pdf_file
                            ? 'border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                            : 'cursor-not-allowed border-slate-200 bg-slate-50/50 text-slate-400',
                    )}
                    disabled={!publication.pdf_file}
                    asChild={!!publication.pdf_file}
                >
                    {publication.pdf_file ? (
                        <a href={publication.pdf_file} target="_blank" rel="noopener noreferrer">
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

                {mode === 'available' && (
                    <>
                        <Button
                            size="sm"
                            className="h-9 w-full justify-center gap-2 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-200/50 hover:bg-emerald-700 sm:w-auto"
                            asChild
                        >
                            <Link to={`/publication/${publication.publ_id}`}>
                                <BookOpen className="size-4" />
                                <span>Продолжить</span>
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-full justify-center gap-2 rounded-lg border-slate-300 sm:w-auto"
                            asChild
                        >
                            <Link to={`/publication/${publication.publ_id}/submit`}>
                                <CheckCircle2 className="size-4" />
                                <span>Завершить обработку</span>
                            </Link>
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
};
