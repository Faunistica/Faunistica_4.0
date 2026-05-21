import { ArrowRight, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router';

export default function Hero() {
    const navigate = useNavigate();

    return (
        <section className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden bg-white">
            <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="space-y-4">
                            <Badge
                                variant="outline"
                                className="border-[#229ED9] text-[#229ED9] bg-blue-50 px-3 py-1 text-sm rounded-full"
                            >
                                Проект гражданской науки
                            </Badge>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl/none text-slate-900">
                                Оцифруй биологическое наследие
                            </h1>
                            <p className="max-w-[600px] text-slate-600 md:text-xl leading-relaxed">
                                Поиск сведений о находках живых организмов — обязательный этап
                                исследования окружающей среды. Мы превращаем тысячи научных статей в
                                открытую цифровую базу данных.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => navigate('/auth/register')}
                                size="lg"
                                className="bg-slate-900 text-white hover:bg-slate-800 gap-2 h-12 px-8 text-base"
                            >
                                Стать волонтером <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 h-12 px-8 text-base"
                            >
                                Узнать больше
                            </Button>
                        </div>
                    </div>
                    <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsrjxQrStxvS_pnd2XmpIIOl3toW8Pv8He4A&s"
                            alt="Макрофотография паутины"
                            className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-6 md:p-8">
                            <div className="text-white space-y-1 mt-auto">
                                <div className="font-semibold text-lg flex items-center gap-2">
                                    <Bug className="h-5 w-5" />
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
