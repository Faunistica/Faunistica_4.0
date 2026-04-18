import { Trophy, BookOpen, Users, ShieldCheck, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Volunteers() {
    return (
        <section id="volunteers" className="w-full py-16 md:py-24 bg-slate-900 text-slate-50">
            <div className="w-full max-w-7xl px-4 md:px-6 mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                            Для волонтеров
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
                            Ваш вклад в большую науку
                        </h2>
                        <p className="text-slate-400 md:text-lg leading-relaxed">
                            Нам нужна помощь в распознавании и структурировании сведений из предложенных научных статей. Мы постарались сделать так, чтобы участие в проекте было для вас не только полезным, но и захватывающим.
                        </p>

                        <div className="pt-4 grid sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Trophy className="h-6 w-6 text-amber-400 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white">Рейтинг и сувениры</h4>
                                    <p className="text-sm text-slate-400">Грамоты, звания и мерч с символикой проекта для самых активных.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BookOpen className="h-6 w-6 text-blue-400 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white">Эксклюзивные знания</h4>
                                    <p className="text-sm text-slate-400">Доступ к закрытым материалам по биологии, экологии и биоразнообразию.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-6 w-6 text-emerald-400 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white">Сообщество</h4>
                                    <p className="text-sm text-slate-400">Офлайн-встречи, лекции и энтомологические экскурсии на Урале.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-6 w-6 text-purple-400 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white">Терапия фобий</h4>
                                    <p className="text-sm text-slate-400">Отличный (и безопасный!) способ узнать больше и побороть свою арахнофобию.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold w-full sm:w-auto">
                                Смотреть инструкцию волонтера
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <Card className="bg-slate-800 border-slate-700 shadow-2xl relative z-10">
                            <CardHeader>
                                <CardTitle className="text-xl text-white">Студентам и школьникам</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-slate-300">
                                <p>
                                    Платформа предоставляет уникальную возможность выполнить школьную исследовательскую, студенческую курсовую или дипломную работу на базе реальных научных данных.
                                </p>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center gap-4">
                                    <FileText className="h-8 w-8 text-[#229ED9]" />
                                    <p className="text-sm">
                                        Наиболее активные и продуктивные волонтеры могут рассчитывать на соавторство в научных публикациях.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="absolute -bottom-6 -right-6 w-full h-full bg-slate-700 rounded-xl -z-10 opacity-50 blur-sm"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
