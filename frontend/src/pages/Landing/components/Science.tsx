import { Microscope } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function Science() {
    return (
        <section id="science" className="w-full py-16 md:py-24 bg-white">
            <div className="w-full max-w-7xl px-4 md:px-6 mx-auto">
                <div className="text-center mb-12">
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 mb-4">Для специалистов</Badge>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
                        Научная основа проекта
                    </h2>
                </div>

                <div className="mx-auto max-w-4xl bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-10 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="shrink-0 flex items-start justify-center md:pt-2">
                            <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100">
                                <Microscope className="h-10 w-10 text-slate-700" />
                            </div>
                        </div>
                        <div className="space-y-6 text-slate-600 leading-relaxed">
                            <p>
                                Проект «Паутина данных» — это первое применение подходов <strong>Data Science</strong> и гражданской науки для оцифровки академических публикаций в нашей области. Мы прокладываем мост между литературным наследием прошлого и порталами данных о биоразнообразии будущего.
                            </p>
                            <p>
                                К настоящему времени создана платформа для перевода данных в стандарт <strong>DarwinCore</strong>. В сотрудничестве с К.Г. Михайловым разработано веб-приложение <strong>Arachnolibrary</strong>, база которого уже содержит 5200 источников.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex items-center gap-3 w-full sm:w-auto">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    <span className="font-medium text-slate-900 text-sm">При поддержке РНФ (№ 24-24-00460)</span>
                                </div>
                                <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex items-center gap-3 w-full sm:w-auto">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    <span className="font-medium text-slate-900 text-sm">Интеграция с GBIF</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
