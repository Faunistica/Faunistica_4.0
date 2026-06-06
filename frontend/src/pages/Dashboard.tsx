import { useMemo, type FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { PublicationRow } from '@/components/articles/PublicationRow';
import { publAPI } from '@/api/publAPI';
import type { Publication } from '@/types/domain';

const Dashboard: FC = () => {
    const {
        data: currentPublications = [],
        isLoading,
        isError,
    } = publAPI.useGetCurrentPublicationQuery({ list: true });

    if (isLoading) return <div className="p-4 text-slate-500">Загрузка публикаций...</div>;
    if (isError) return <div className="p-4 text-red-500">Ошибка при загрузке публикаций.</div>;

    const [availible, queue] = useMemo(() => {
        const splitIndex = currentPublications.findIndex((item) => !item.interactable);

        return splitIndex === -1
            ? [currentPublications, [] as Publication[]]
            : [currentPublications.slice(0, splitIndex), currentPublications.slice(splitIndex)];
    }, [currentPublications]);

    return (
        <>
            <div className="grid grid-cols-1 gap-8">
                {availible.length > 0 && (
                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase md:text-base">
                                    Доступно к обработке
                                </h2>
                                <Badge className="rounded-md border-none bg-amber-100 px-2 font-bold text-amber-800 hover:bg-amber-100">
                                    {availible.length}
                                </Badge>
                            </div>
                        </div>
                        {availible.map((pub) => (
                            <PublicationRow key={pub.publ_id} publication={pub} mode="available" />
                        ))}
                    </section>
                )}
                {queue.length > 0 && (
                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase md:text-base">
                                    В очереди
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
