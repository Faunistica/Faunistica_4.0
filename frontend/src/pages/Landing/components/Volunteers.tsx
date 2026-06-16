import { Trophy, BookOpen, Users, ShieldCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Volunteers() {
    const { t } = useTranslation();
    return (
        <section id="volunteers" className="w-full bg-slate-900 py-16 text-slate-50 md:py-24">
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <div className="space-y-6">
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                            {t('landing.forVolunteers')}
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            {t('landing.yourContribution')}
                        </h2>
                        <p className="leading-relaxed text-slate-400 md:text-lg">
                            {t('landing.contributionDesc')}
                        </p>

                        <div className="grid gap-4 pt-4 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <Trophy className="size-6 shrink-0 text-amber-400" />
                                <div>
                                    <h4 className="font-semibold text-white">{t('landing.rating')}</h4>
                                    <p className="text-sm text-slate-400">
                                        {t('landing.ratingDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BookOpen className="size-6 shrink-0 text-blue-400" />
                                <div>
                                    <h4 className="font-semibold text-white">{t('landing.exclusive')}</h4>
                                    <p className="text-sm text-slate-400">
                                        {t('landing.exclusiveDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="size-6 shrink-0 text-emerald-400" />
                                <div>
                                    <h4 className="font-semibold text-white">{t('landing.community')}</h4>
                                    <p className="text-sm text-slate-400">
                                        {t('landing.communityDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="size-6 shrink-0 text-purple-400" />
                                <div>
                                    <h4 className="font-semibold text-white">{t('landing.phobia')}</h4>
                                    <p className="text-sm text-slate-400">
                                        {t('landing.phobiaDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="h-12 border-slate-300 bg-white px-8 text-base text-slate-700 hover:bg-slate-50"
                            >
                                <Link to="/instructions">{t('landing.watchInstructions')}</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <Card className="relative z-10 border-slate-700 bg-slate-800 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-white">
                                    {t('landing.forStudents')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-slate-300">
                                <p>
                                    {t('landing.studentDesc')}
                                </p>
                                <div className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                                    <FileText className="size-8 text-[#229ED9]" />
                                    <p className="text-sm">
                                        {t('landing.coauthorship')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="absolute -right-6 -bottom-6 -z-10 size-full rounded-xl bg-slate-700 opacity-50 blur-sm"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
