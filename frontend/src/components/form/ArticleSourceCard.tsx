import { type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useGetCurrentPublicationQuery } from '@/api/publAPI';
import { useMemo } from 'react';

interface Props {
    publ_id: number;
}

const ArticleSourceCard: FC<Props> = ({ publ_id }) => {
    const { data: publications, isLoading, error } = useGetCurrentPublicationQuery({ list: true });

    const publication = useMemo(() => {
        return publications?.find((p) => p.publ_id === publ_id);
    }, [publications, publ_id]);

    if (isLoading) {
        return (
            <Card className="border-slate-300 shadow-sm bg-white relative overflow-hidden flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </Card>
        );
    }

    if (error || !publication) {
        return (
            <Card className="border-red-200 shadow-sm bg-red-50 relative overflow-hidden p-6">
                <p className="text-red-600 text-sm font-medium">Ошибка загрузки данных источника</p>
            </Card>
        );
    }

    const openPdf = () => {
        if (publication.pdf_file) {
            window.open(publication.pdf_file, '_blank');
        }
    };

    return (
        <Card className="border-slate-300 shadow-sm bg-white relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-800"></div>
            <CardHeader className="pl-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">
                                Источник данных
                            </Badge>
                            <span className="text-xs text-slate-500 font-mono">
                                ID: PUB-{publication.publ_id}
                            </span>
                        </div>
                        <CardTitle className="text-lg md:text-xl leading-tight text-slate-900">
                            {publication.name || 'Без названия'}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {publication.author}
                            {publication.year ? ` (${publication.year})` : ''}
                        </CardDescription>
                    </div>
                    {publication.pdf_file && (
                        <Button
                            variant="outline"
                            className="shrink-0 gap-2 border-slate-300 w-full md:w-auto"
                            onClick={openPdf}
                        >
                            <FileText className="h-4 w-4" />
                            Открыть PDF
                        </Button>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
};

export default ArticleSourceCard;
