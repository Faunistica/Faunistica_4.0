import { type FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PublicationRow } from "@/components/articles/PublicationRow";
import { publAPI } from "@/api/publAPI"; // Замените на актуальный путь до вашего API

const Dashboard: FC = () => {
    // Получаем текущие (назначенные модератором) публикации
    const {
        data: currentPublications = [],
        isLoading,
        isError
    } = publAPI.useGetCurrentPublicationQuery({ list: false });

    /* 
     * TODO: Функционал "В работе" и "Бронирование" будет добавлен в API в будущем.
     * Моковые данные и компоненты закомментированы, удалять нельзя.
     *
    const MOCK_IN_PROGRESS: any[] = [
        {
            id: 3412, type: "M", author: "Ivanov A.V.", year: 2021,
            name: "Fauna of the Southern Urals",
            language: "RU", ural: true, pdf_file: "p3412_2021_ivanov.pdf"
        }
    ];

    const MOCK_AVAILABLE: any[] = [
        {
            id: 3901, type: "S", author: "Marusik Y.M.", year: 2018,
            name: "New species of spiders from Northern Asia",
            language: "EN", ural: false, pdf_file: "p3901_2018_marusik.pdf",
            bookedBy: 2, processedBy: 5
        },
        // ... остальные моковые данные
    ];
    */

    if (isLoading) return <div className="p-4 text-slate-500">Загрузка публикаций...</div>;
    if (isError) return <div className="p-4 text-red-500">Ошибка при загрузке публикаций.</div>;

    return (
        <>
            <div className="grid grid-cols-1 gap-8">

                {/* Блок: Назначено модератором (Текущие задачи из API) */}
                {currentPublications.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide">Назначено модератором</h2>
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-2 rounded-md font-bold">
                                    {currentPublications.length}
                                </Badge>
                            </div>
                        </div>
                        <Card className="border-amber-200 bg-amber-50/30 shadow-sm overflow-hidden rounded-xl">
                            <div className="flex flex-col">
                                {currentPublications.map(pub => (
                                    <PublicationRow key={pub.id} pub={pub} mode="suggested" />
                                ))}
                            </div>
                        </Card>
                    </section>
                )}

                {/* Блок: В процессе работы (Закомментировано до обновления API) */}
                {/* 
                {MOCK_IN_PROGRESS.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide">В процессе обработки</h2>
                        </div>
                        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
                            <div className="flex flex-col">
                                {MOCK_IN_PROGRESS.map(pub => (
                                    <PublicationRow key={pub.id} pub={pub} mode="progress" />
                                ))}
                            </div>
                        </Card>
                    </section>
                )}
                */}

            </div>

            {/* Общий пул доступных публикаций (Закомментировано до обновления API) */}
            {/*
            <section>
                <div className="mb-4 border-b border-slate-200 pb-3 mt-8">
                    <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide">Доступные публикации</h2>
                    <p className="text-sm text-slate-500 mt-1">Резерв необработанных материалов для самостоятельного бронирования</p>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
                    <div className="flex flex-col">
                        {MOCK_AVAILABLE.map(pub => (
                            <PublicationRow key={pub.id} pub={pub} mode="available" />
                        ))}
                    </div>
                </Card>
            </section>
            */}
        </>
    );
};

export default Dashboard;