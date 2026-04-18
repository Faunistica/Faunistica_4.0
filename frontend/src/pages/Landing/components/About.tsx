import { Search, Network, Globe, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function About() {
    return (
        <section id="about" className="w-full py-16 md:py-24 bg-slate-50 border-t border-slate-200">
            <div className="w-full max-w-7xl px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center space-y-4 mb-12">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
                        Почему это важно?
                    </h2>
                    <p className="max-w-[800px] text-slate-600 md:text-lg">
                        О находках живых организмов существуют тысячи публикаций, и их число растет лавинообразно. Традиционный поиск тормозит научный прогресс.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center mb-4 text-red-600">
                                <Search className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl">Ручной труд</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed">
                                Традиционный подход требует тотального просмотра всех публикаций. Это отнимает колоссальное количество времени, сил и ресурсов исследователей.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                                <Network className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl">Изолированность</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed">
                                Данные из старых статей почти не представлены в современных агрегаторах. Каждый специалист ищет их заново, выполняя двойную работу.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Database className="h-32 w-32" />
                        </div>
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
                                <Globe className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl">Решение: Оцифровка</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed relative z-10">
                                Мы создаем платформу, чтобы перевести литературные данные в цифровую форму. Это сделает их доступными для глобальных баз, таких как <strong>GBIF</strong>.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
