import { Search, Network, Globe, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function About() {
    return (
        <section id="about" className="w-full border-t border-slate-200 bg-slate-50 py-16 md:py-24">
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                <div className="mb-12 flex flex-col items-center space-y-4 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Почему это важно?
                    </h2>
                    <p className="max-w-[800px] text-slate-600 md:text-lg">
                        О находках живых организмов существуют тысячи публикаций, и их число растет
                        лавинообразно. Традиционный поиск тормозит научный прогресс.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader>
                            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                <Search className="size-6" />
                            </div>
                            <CardTitle className="text-xl">Ручной труд</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-relaxed text-slate-600">
                                Традиционный подход требует тотального просмотра всех публикаций.
                                Это отнимает колоссальное количество времени, сил и ресурсов
                                исследователей.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm">
                        <CardHeader>
                            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Network className="size-6" />
                            </div>
                            <CardTitle className="text-xl">Изолированность</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-relaxed text-slate-600">
                                Данные из старых статей почти не представлены в современных
                                агрегаторах. Каждый специалист ищет их заново, выполняя двойную
                                работу.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-none bg-white shadow-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Database className="size-32" />
                        </div>
                        <CardHeader>
                            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <Globe className="size-6" />
                            </div>
                            <CardTitle className="text-xl">Решение: Оцифровка</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="relative z-10 leading-relaxed text-slate-600">
                                Мы создаем платформу, чтобы перевести литературные данные в цифровую
                                форму. Это сделает их доступными для глобальных баз, таких как{' '}
                                <a href="https://www.gbif.org/">
                                    <strong>GBIF</strong>
                                </a>
                                .
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
