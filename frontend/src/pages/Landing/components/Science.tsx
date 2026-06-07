import { Microscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Science() {
    return (
        <section id="science" className="w-full bg-white py-16 md:py-24">
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                <div className="mb-12 text-center">
                    <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                        Для специалистов
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Научная основа проекта
                    </h2>
                </div>

                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-10">
                    <div className="flex flex-col gap-8 md:flex-row">
                        <div className="flex shrink-0 items-start justify-center md:pt-2">
                            <div className="rounded-full border border-slate-100 bg-white p-4 shadow-sm">
                                <Microscope className="size-10 text-slate-700" />
                            </div>
                        </div>
                        <div className="space-y-6 leading-relaxed text-slate-600">
                            <p>
                                Проект «Паутина данных» — это первое применение подходов{' '}
                                <strong>Data Science</strong> и гражданской науки для оцифровки
                                академических публикаций в нашей области. Мы прокладываем мост между
                                литературным наследием прошлого и порталами данных о биоразнообразии
                                будущего.
                            </p>
                            <p>
                                К настоящему времени создана платформа для перевода данных в
                                стандарт <strong>DarwinCore</strong>. В сотрудничестве с К.Г.
                                Михайловым разработано веб-приложение{' '}
                                <a href="https://faunistics.international/arachnolibrary/" >
                                    <strong>Arachnolibrary</strong>
                                </a>, база которого уже содержит 5200 источников.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:w-auto">
                                    <span className="size-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-sm font-medium text-slate-900">
                                        При поддержке РНФ (№ 24-24-00460)
                                    </span>
                                </div>
                                <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:w-auto">
                                    <span className="size-2 rounded-full bg-blue-500"></span>
                                    <span className="text-sm font-medium text-slate-900">
                                        Интеграция с GBIF
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
}
