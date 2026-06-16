import { Microscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function Science() {
    const { t } = useTranslation();
    return (
        <section id="science" className="w-full bg-white py-16 md:py-24">
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                <div className="mb-12 text-center">
                    <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                        {t('landing.forSpecialists')}
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        {t('landing.scienceTitle')}
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
                                {t('landing.scienceDesc1')}
                            </p>
                            <p>
                                {t('landing.scienceDesc2')}
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:w-auto">
                                    <span className="size-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {t('landing.rnfSupport')}
                                    </span>
                                </div>
                                <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:w-auto">
                                    <span className="size-2 rounded-full bg-blue-500"></span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {t('landing.gbifIntegration')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
