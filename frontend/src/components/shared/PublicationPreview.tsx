import { type FC } from 'react';
import { Calendar, User, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import type { Publication } from '@/types/domain';
import { cn } from '@/lib/utils';

interface PublicationPreviewProps {
    publication: Publication;
    border: string;
}

export const PublicationPreview: FC<PublicationPreviewProps> = ({ publication, border }) => {
    return (
        <>
            <div
                className={cn('pointer-events-none absolute inset-0 rounded-xl border-l-3', border)}
            />
            <CardHeader className="w-full min-w-0 flex-1 pl-1">
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
                    className="line-clamp-2 text-lg font-semibold text-slate-800 transition-colors group-hover:text-slate-900 md:text-base"
                    title={publication.name || 'Название публикации отсутствует'}
                >
                    {publication.name || 'Название публикации отсутствует'}
                </CardTitle>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-2">
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
                </div>
            </CardHeader>
        </>
    );
};
