import { Loader2, MessageCircle, Send, HelpCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetBotUrlQuery } from '@/api/authAPI';
import { TelegramQRCode } from '@/pages/Auth/Telegram';

export default function Support() {
    const { data: botData, isLoading } = useGetBotUrlQuery();
    const botUrl = botData?.bot_url;
    const supportUrl = botUrl ? `${botUrl}?start=support` : undefined;

    if (isLoading) {
        return (
            <div className="flex h-full min-h-[50vh] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <main className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
            <div className="w-full max-w-3xl space-y-8">
                <Card className="overflow-hidden border-border shadow-sm">
                    <CardHeader className="space-y-4 pb-8 text-center">
                        {/* <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-50">
                            <HelpCircle className="size-8 text-telegram" />
                        </div> */}
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                                Служба поддержки
                            </CardTitle>
                            <CardDescription className="mx-auto max-w-lg text-base">
                                Возникли вопросы, нужна помощь или вы нашли ошибку?
                                Напишите нашему Telegram-боту, и мы оперативно вам поможем!
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-10 md:px-12">
                        <div className="flex flex-col items-center justify-center gap-10 md:flex-row md:items-stretch md:gap-12">
                            {/* Левая колонка: Инструкция */}
                            <div className="flex flex-1 flex-col justify-center space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-foreground">
                                        Как связаться с поддержкой?
                                    </h3>
                                    <ul className="space-y-3 text-muted-foreground">
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                                                1
                                            </div>
                                            <span>
                                                Перейдите в наш Telegram-бот по кнопке ниже, отсканируйте QR-код или перейдите по прямой ссылке:{' '}
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
                                                    <span className="text-muted-foreground">загрузка...</span>
                                                )}
                                                .
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                                                2
                                            </div>
                                            <span>
                                                Нажмите кнопку <strong>«Запустить»</strong> (Start), если вы впервые открываете бота.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                                                3
                                            </div>
                                            <span>
                                                Если бот не перешел в режим поддержки автоматически, отправьте команду <strong>/support</strong>.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                                                4
                                            </div>
                                            <span>
                                                Опишите вашу проблему, и наша команда поддержки ответит вам в кратчайшие сроки.
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
                                        Написать в поддержку
                                    </a>
                                </Button>
                            </div>

                            {/* Правая колонка: QR-код */}
                            <div className="flex shrink-0 flex-col items-center justify-center space-y-4">
                                <div className="rounded-2xl border-2 border-dashed border-border bg-card p-4">
                                    {supportUrl ? (
                                        <TelegramQRCode botUrl={supportUrl} />
                                    ) : (
                                        <div className="flex h-[180px] w-[180px] items-center justify-center bg-muted">
                                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Отсканируйте QR-код
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Дополнительный блок (опционально) */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                    <MessageCircle className="mx-auto mb-2 size-6 text-blue-500" />
                    <p>
                        Мы стараемся отвечать на все запросы в течение 24 часов.<br />
                        Спасибо, что помогаете делать проект лучше!
                    </p>
                </div>
            </div>
        </main>
    );
}
