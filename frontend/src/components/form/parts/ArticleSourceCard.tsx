import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useGetPublicationByIdQuery } from '@/api/publAPI';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicationPreview } from '@/components/shared/PublicationPreview';
import PublicationSourceFiles from '@/components/shared/PublicationSourceFiles';

interface Props {
    publ_id: number;
}

const ArticleSourceCard: FC<Props> = ({ publ_id }) => {
    const { t } = useTranslation();
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
                <p className="text-sm font-medium text-red-600">{t('form.sourceError')}</p>
            </Card>
        );
    }

    return (
        <Card className="relative mb-4 p-4 shadow-sm transition-all duration-200 hover:border-slate-300/80 hover:shadow-md sm:p-5 lg:flex-row">
            <PublicationPreview publication={publication} border="border-slate-800" />
            <div className="mt-3 flex shrink-0 items-center justify-end lg:mt-0 lg:ml-auto lg:self-center">
                <PublicationSourceFiles publication={publication} />
            </div>
        </Card>
    );
};

export default ArticleSourceCard;
