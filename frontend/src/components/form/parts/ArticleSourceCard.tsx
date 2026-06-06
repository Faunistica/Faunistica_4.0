import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useGetPublicationByIdQuery } from '@/api/publAPI';
import { type FC } from 'react';
import { FileDown, Calendar, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    publ_id: number;
}

const ArticleSourceCard: FC<Props> = ({ publ_id }) => {
    const { data: publication, isLoading, error } = useGetPublicationByIdQuery(publ_id);

    if (isLoading) {
        return (
            <Card className="relative flex items-center justify-center overflow-hidden border-slate-300 bg-white p-8 shadow-sm">
                <Loader2 className="size-6 animate-spin text-slate-400" />
            </Card>
        );
    }

    if (error || !publication) {
        return (
            <Card className="relative overflow-hidden border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-red-600">Ошибка загрузки данных источника</p>
            </Card>
        );
    }

    return (
        <Card className="relative mb-4 p-4 shadow-sm transition-all duration-200 hover:border-slate-300/80 hover:shadow-md sm:p-5 lg:flex-row">
            <div className="pointer-events-none absolute inset-0 rounded-xl border-l-3 border-slate-800" />

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
            </div>
        </Card>
    );
};

export default ArticleSourceCard;
