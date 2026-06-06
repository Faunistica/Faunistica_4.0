import { type FC } from 'react';
import { FileDown, FileText, FileArchive, Calendar, User, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import type { Publication } from '@/types/domain';

interface PublicationPreviewProps {
    publication: Publication;
    border: string;
}

export const PublicationPreview: FC<PublicationPreviewProps> = ({ publication, border }) => {
    const hasFiles = publication.pdf_file || publication.bib_file || publication.arj_file;

    return (
        <>
            <div className={`pointer-events-none absolute inset-0 rounded-xl border-l-3 ${border}`} />
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
                    title={publication.name || 'Без названия'}
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

                    {hasFiles && (
                        <div className="flex items-center gap-2">
                            {publication.pdf_file && (
                                <a
                                    href={publication.pdf_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-slate-400 transition-colors hover:text-slate-700"
                                >
                                    <FileDown className="size-3.5" />
                                    <span>PDF</span>
                                </a>
                            )}
                            {publication.bib_file && (
                                <a
                                    href={publication.bib_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-slate-400 transition-colors hover:text-slate-700"
                                >
                                    <FileText className="size-3.5" />
                                    <span>BIB</span>
                                </a>
                            )}
                            {publication.arj_file && (
                                <a
                                    href={publication.arj_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-slate-400 transition-colors hover:text-slate-700"
                                >
                                    <FileArchive className="size-3.5" />
                                    <span>ARJ</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>
        </>
    );
};
