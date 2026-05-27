import { Trophy, BookOpen, Users, ShieldCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Volunteers() {
    return (
        <section id="volunteers" className="w-full bg-slate-900 py-16 text-slate-50 md:py-24">
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <div className="space-y-6">
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                            Для волонтеров
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Ваш вклад в большую науку
                        </h2>
                        <p className="leading-relaxed text-slate-400 md:text-lg">
                            Нам нужна помощь в распознавании и структурировании сведений из
                            предложенных научных статей. Мы постарались сделать так, чтобы участие в
                            проекте было для вас не только полезным, но и захватывающим.
                        </p>

                        <div className="grid gap-4 pt-4 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <Trophy className="size-6  shrink-0 text-amber-400" />
                                <div>
                                    <h4 className="font-semibold text-white">Рейтинг и сувениры</h4>
                                    <p className="text-sm text-slate-400">
                                        Грамоты, звания и мерч с символикой проекта для самых
                                        активных.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BookOpen className="size-6  shrink-0 text-blue-400" />
                                <div>
                                    <h4 className="font-semibold text-white">
                                        Эксклюзивные знания
                                    </h4>
                                    <p className="text-sm text-slate-400">
                                        Доступ к закрытым материалам по биологии, экологии и
                                        биоразнообразию.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="size-6  shrink-0 text-emerald-400" />
                                <div>
                                    <h4 className="font-semibold text-white">Сообщество</h4>
                                    <p className="text-sm text-slate-400">
                                        Офлайн-встречи, лекции и энтомологические экскурсии на
                                        Урале.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="size-6  shrink-0 text-purple-400" />
                                <div>
                                    <h4 className="font-semibold text-white">Терапия фобий</h4>
                                    <p className="text-sm text-slate-400">
                                        Отличный (и безопасный!) способ узнать больше и побороть
                                        свою арахнофобию.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button className="w-full bg-white font-semibold text-slate-900 hover:bg-slate-100 sm:w-auto">
                                Смотреть инструкцию волонтера
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <Card className="relative z-10 border-slate-700 bg-slate-800 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-white">
                                    Студентам и школьникам
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-slate-300">
                                <p>
                                    Платформа предоставляет уникальную возможность выполнить
                                    школьную исследовательскую, студенческую курсовую или дипломную
                                    работу на базе реальных научных данных.
                                </p>
                                <div className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                                    <FileText className="size-8  text-[#229ED9]" />
                                    <p className="text-sm">
                                        Наиболее активные и продуктивные волонтеры могут
                                        рассчитывать на соавторство в научных публикациях.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="absolute -right-6 -bottom-6 -z-10 size-full  rounded-xl bg-slate-700 opacity-50 blur-sm"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
