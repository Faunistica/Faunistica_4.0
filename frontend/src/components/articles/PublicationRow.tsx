import { type FC } from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { PublicationPreview } from '@/components/shared/PublicationPreview';
import PublicationSourceFiles from '@/components/shared/PublicationSourceFiles';
import type { Publication } from '@/types/domain';

interface PublicationRowProps {
    publication: Publication;
    mode: 'progress' | 'available';
}

export const PublicationRow: FC<PublicationRowProps> = ({ publication, mode }) => {
    const { t } = useTranslation();
    const border = mode === 'progress' ? 'border-blue-400' : 'border-emerald-400';

    return (
        <Card className="relative mb-4 gap-2.5 p-4 shadow-sm transition-all duration-200 hover:border-slate-300/80 hover:shadow-md sm:p-5 lg:flex-row">
            <PublicationPreview publication={publication} border={border} />

            {mode === 'available' && (
                <div className="mt-1 flex w-full shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center lg:mt-0 lg:w-auto">
                    <Button
                        size="sm"
                        className="h-9 w-full justify-center gap-2 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-200/50 hover:bg-emerald-700 sm:w-auto"
                        asChild
                    >
                        <Link to={`/publication/${publication.publ_id}`}>
                            <BookOpen className="size-4" />
                            <span>{t('dashboard.continue')}</span>
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
                            <span>{t('dashboard.finish')}</span>
                        </Link>
                    </Button>
                </div>
            )}

            <div className="mt-3 flex shrink-0 items-center justify-end lg:mt-0 lg:ml-auto lg:self-center">
                <PublicationSourceFiles publication={publication} />
            </div>
        </Card>
    );
};
