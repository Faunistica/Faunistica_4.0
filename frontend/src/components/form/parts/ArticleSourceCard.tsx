import { type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useGetPublicationByIdQuery } from '@/api/publAPI';

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

    const openPdf = () => {
        if (publication.pdf_file) {
            window.open(publication.pdf_file, '_blank');
        }
    };

    return (
        <Card className="relative overflow-hidden border-slate-300 bg-white shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-slate-800"></div>
            <CardHeader className="pl-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Badge className="border-none bg-slate-100 text-slate-700 hover:bg-slate-200">
                                Источник данных
                            </Badge>
                            <span className="pt-1 font-mono text-xs text-slate-500">
                                ID: PUB-{publication.publ_id}
                            </span>
                        </div>
                        <CardTitle className="text-lg/tight text-slate-900 md:text-xl">
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
                            className="w-full shrink-0 gap-2 border-slate-300 md:w-auto"
                            onClick={openPdf}
                        >
                            <FileText className="size-4" />
                            Открыть PDF
                        </Button>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
};

export default ArticleSourceCard;
