import { ArrowRight, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router';

export default function Hero() {
    const navigate = useNavigate();

    return (
        <section className="relative w-full overflow-hidden bg-white py-12 md:py-24 lg:py-32">
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="space-y-4">
                            <Badge
                                variant="outline"
                                className="rounded-full border-[#229ED9] bg-blue-50 px-3 py-1 text-sm text-[#229ED9]"
                            >
                                Проект гражданской науки
                            </Badge>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl xl:text-6xl/none">
                                Оцифруй биологическое наследие
                            </h1>
                            <p className="max-w-[600px] leading-relaxed text-slate-600 md:text-xl">
                                Поиск сведений о находках живых организмов — обязательный этап
                                исследования окружающей среды. Мы превращаем тысячи научных статей в
                                открытую цифровую базу данных.
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Button
                                onClick={() => navigate('/auth/register')}
                                size="lg"
                                className="h-12 gap-2 bg-slate-900 px-8 text-base text-white hover:bg-slate-800"
                            >
                                Стать волонтером <ArrowRight className="size-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 border-slate-300 bg-white px-8 text-base text-slate-700 hover:bg-slate-50"
                            >
                                Узнать больше
                            </Button>
                        </div>
                    </div>
                    <div className="relative mx-auto aspect-square w-full max-w-[500px] overflow-hidden rounded-2xl border border-slate-200 shadow-2xl lg:aspect-4/3 lg:max-w-none">
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsrjxQrStxvS_pnd2XmpIIOl3toW8Pv8He4A&s"
                            alt="Макрофотография паутины"
                            className="size-full transform object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-slate-900/60 to-transparent p-6 md:p-8">
                            <div className="mt-auto space-y-1 text-white">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <Bug className="size-5" />
                                    Модельная группа: Пауки Урала
                                </div>
                                <p className="text-sm text-slate-200">
                                    Идеальный старт для отработки технологий работы с Big Data в
                                    биологии.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
