import { useMemo, type FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { PublicationRow } from '@/components/articles/PublicationRow';
import { publAPI } from '@/api/publAPI';
import type { Publication } from '@/types/domain';
import { useTranslation } from 'react-i18next';

const Dashboard: FC = () => {
    const { t } = useTranslation();
    const {
        data: currentPublications = [],
        isLoading,
        isError,
    } = publAPI.useGetCurrentPublicationQuery({ list: true });

    if (isLoading) return <div className="p-4 text-slate-500">{t('common.loading')}</div>;
    if (isError) return <div className="p-4 text-red-500">{t('common.error')}</div>;

    const [available, queue] = useMemo(() => {
        const splitIndex = currentPublications.findIndex((item) => !item.interactable);

        return splitIndex === -1
            ? [currentPublications, [] as Publication[]]
            : [currentPublications.slice(0, splitIndex), currentPublications.slice(splitIndex)];
    }, [currentPublications]);

    return (
        <>
            <div className="grid grid-cols-1 gap-8">
                {available.length > 0 && (
                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase md:text-base">
                                    {t('dashboard.available')}
                                </h2>
                                <Badge className="rounded-md border-none bg-amber-100 px-2 font-bold text-amber-800 hover:bg-amber-100">
                                    {available.length}
                                </Badge>
                            </div>
                        </div>
                        {available.map((pub) => (
                            <PublicationRow key={pub.publ_id} publication={pub} mode="available" />
                        ))}
                    </section>
                )}
                {queue.length > 0 && (
                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase md:text-base">
                                    {t('dashboard.inQueue')}
                                </h2>
                                <Badge className="rounded-md border-none bg-amber-100 px-2 font-bold text-amber-800 hover:bg-amber-100">
                                    {queue.length}
                                </Badge>
                            </div>
                        </div>
                        {queue.map((pub) => (
                            <PublicationRow key={pub.publ_id} publication={pub} mode="progress" />
                        ))}
                    </section>
                )}
            </div>
        </>
    );
};

export default Dashboard;
