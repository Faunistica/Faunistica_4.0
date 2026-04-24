import { type FC, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PublicationRow, type Publication } from "@/components/articles/PublicationRow";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

const Dashboard: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const isToastShown = useRef(false);

    useEffect(() => {
        const state = location.state as { showSuccessAlert?: boolean } | null;

        if (state?.showSuccessAlert && !isToastShown.current) {
            isToastShown.current = true;

            toast.success("Успех!", {
                description: "Ваши данные были успешно отправлены.",
                duration: 3000,
            });
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate, toast]);

    const MOCK_SUGGESTED: Publication[] = [
        {
            publ_id: 3855, type: "S", author: "Logunov D.V.", year: 2012,
            name: "A synopsis of the genus Zyuzicosa Logunov, 2010 (Araneae, Lycosidae)",
            language: "EN", ural: false, pdf_file: "p3855_2012_logunov.pdf"
        },
        {
            publ_id: 3856, type: "A", author: "Esyunin S.L.", year: 2015,
            name: "Remarks on the Ural spider fauna",
            language: "RU", ural: true, pdf_file: "p3856_2015_esyunin.pdf"
        }
    ];

    const MOCK_IN_PROGRESS: Publication[] = [
        {
            publ_id: 3412, type: "M", author: "Ivanov A.V.", year: 2021,
            name: "Fauna of the Southern Urals",
            language: "RU", ural: true, pdf_file: "p3412_2021_ivanov.pdf"
        }
    ];

    const MOCK_AVAILABLE: Publication[] = [
        {
            publ_id: 3901, type: "S", author: "Marusik Y.M.", year: 2018,
            name: "New species of spiders from Northern Asia",
            language: "EN", ural: false, pdf_file: "p3901_2018_marusik.pdf",
            bookedBy: 2, processedBy: 5
        },
        {
            publ_id: 3902, type: "A", author: "Kovblyuk M.M.", year: 2019,
            name: "Spiders of the genus Zelotes in Crimea",
            language: "RU", ural: false, pdf_file: "p3902_2019_kovblyuk.pdf",
            bookedBy: 0, processedBy: 1
        },
        {
            publ_id: 3905, type: "S", author: "Tuneva T.K.", year: 2020,
            name: "Gnaphosidae of the Ural mountains",
            language: "RU", ural: true, pdf_file: "p3905_2020_tuneva.pdf",
            bookedBy: 1, processedBy: 0
        }
    ];

    return (
        <>
            {/* Приоритетные задачи (Предложено + В работе) */}
            <div className="grid grid-cols-1 gap-8">

                {/* Блок: Назначено модератором */}
                {MOCK_SUGGESTED.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide">Назначено модератором</h2>
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-2 rounded-md font-bold">
                                    {MOCK_SUGGESTED.length}
                                </Badge>
                            </div>
                        </div>
                        <Card className="border-amber-200 bg-amber-50/30 shadow-sm overflow-hidden rounded-xl">
                            <div className="flex flex-col">
                                {MOCK_SUGGESTED.map(pub => (
                                    <PublicationRow key={pub.publ_id} pub={pub} mode="suggested" />
                                ))}
                            </div>
                        </Card>
                    </section>
                )}

                {/* Блок: В процессе работы */}
                {MOCK_IN_PROGRESS.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide">В процессе обработки</h2>
                        </div>
                        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
                            <div className="flex flex-col">
                                {MOCK_IN_PROGRESS.map(pub => (
                                    <PublicationRow key={pub.publ_id} pub={pub} mode="progress" />
                                ))}
                            </div>
                        </Card>
                    </section>
                )}

            </div>

            {/* Общий пул доступных публикаций */}
            <section>
                <div className="mb-4 border-b border-slate-200 pb-3 mt-8">
                    <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide">Доступные публикации</h2>
                    <p className="text-sm text-slate-500 mt-1">Резерв необработанных материалов для самостоятельного бронирования</p>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
                    <div className="flex flex-col">
                        {MOCK_AVAILABLE.map(pub => (
                            <PublicationRow key={pub.publ_id} pub={pub} mode="available" />
                        ))}
                    </div>
                </Card>
            </section>
        </>
    );
};

export default Dashboard;