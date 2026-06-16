import { Loader2, MessageCircle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetBotUrlQuery } from '@/api/authAPI';
import TelegramQRCode from '@/components/qr/TelegramQRCode';
import { useTranslation } from 'react-i18next';

export default function Support() {
    const { t } = useTranslation();
    const { data: botData, isLoading } = useGetBotUrlQuery();
    const botUrl = botData?.bot_url;
    const supportUrl = botUrl ? `${botUrl}?start=support` : undefined;

    if (isLoading) {
        return (
            <div className="flex h-full min-h-[50vh] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <main className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
            <div className="w-full max-w-3xl space-y-8">
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <CardHeader className="space-y-4 pb-8 text-center">
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                                {t('support.title')}
                            </CardTitle>
                            <CardDescription className="mx-auto max-w-lg text-base">
                                {t('support.pageDescription')}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-10 md:px-12">
                        <div className="flex flex-col items-center justify-center gap-10 md:flex-row md:items-stretch md:gap-12">
                            <div className="flex flex-1 flex-col justify-center space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-slate-900">
                                        {t('support.howToContact')}
                                    </h3>
                                    <ul className="space-y-3 text-slate-600">
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-900">
                                                1
                                            </div>
                                            <span>
                                                {t('support.step1')}{' '}
                                                {botUrl ? (
                                                    <a
                                                        href={supportUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium text-telegram hover:underline"
                                                    >
                                                        @{botUrl.replace(/^https?:\/\/t\.me\//, '')}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        {t('support.loading')}
                                                    </span>
                                                )}
                                                .
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-900">
                                                2
                                            </div>
                                            <span>
                                                {t('support.step2')}
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-900">
                                                3
                                            </div>
                                            <span>
                                                {t('support.step3')}
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-900">
                                                4
                                            </div>
                                            <span>
                                                {t('support.step4')}
                                            </span>
                                        </li>
                                    </ul>
                                </div>

                                <Button
                                    className="w-full gap-2 bg-telegram font-semibold text-white shadow-md hover:bg-[#1E8CC0] sm:w-auto sm:px-8"
                                    size="lg"
                                    asChild
                                    disabled={!supportUrl}
                                >
                                    <a
                                        href={supportUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Send className="size-5" />
                                        {t('support.writeToSupport')}
                                    </a>
                                </Button>
                            </div>

                            <div className="flex shrink-0 flex-col items-center justify-center space-y-4">
                                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4">
                                    {supportUrl ? (
                                        <TelegramQRCode botUrl={supportUrl} />
                                    ) : (
                                        <div className="flex size-[180px] items-center justify-center bg-slate-50">
                                            <Loader2 className="size-6 animate-spin text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-slate-500">
                                    {t('support.scanQR')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-center text-sm text-blue-800">
                    <MessageCircle className="mx-auto mb-2 size-6 text-blue-500" />
                    <p>
                        {t('support.responseTime')}
                        <br />
                        {t('support.thanks')}
                    </p>
                </div>
            </div>
        </main>
    );
}
