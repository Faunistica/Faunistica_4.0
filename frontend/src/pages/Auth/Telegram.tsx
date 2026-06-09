import { type FC } from 'react';
import { Send, Key, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import { Link } from 'react-router';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import TermsConsent from './TermsConsent';
import TelegramQRCode from '@/components/qr/TelegramQRCode';

const TelegramAuth: FC = () => {
    const { displayCode, botUrl, statusMessage, isPollingError, isInitLoading, initError } =
        useTelegramAuth();

    return (
        <div className="mx-auto w-full max-w-[700px] space-y-6">
            <Card className="relative overflow-hidden border-slate-200 shadow-sm">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-telegram"></div>
                <CardHeader className="space-y-1 pl-6 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        Вход через Telegram
                    </CardTitle>
                    <CardDescription className="mx-auto mt-2 max-w-md text-slate-500">
                        {'Отправьте этот код сообщением нашему Telegram боту '}
                        <a
                            href={botUrl ? `${botUrl}?start=${displayCode}` : ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-telegram hover:underline"
                        >
                            @{botUrl?.replace(/^https?:\/\/t\.me\//, '')}
                        </a>
                        {', не закрывая данную страницу'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                    <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-stretch">
                        {/* Left Column: Code Block */}
                        <div className="flex w-full max-w-[240px] flex-col justify-center">
                            {isInitLoading ? (
                                <div className="flex h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                                    <Loader2 className="size-8 animate-spin text-telegram" />
                                </div>
                            ) : initError ? (
                                <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-center text-red-500">
                                    <span className="text-sm font-medium">
                                        Не удалось сгенерировать код
                                    </span>
                                </div>
                            ) : (
                                <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 p-6 shadow-inner">
                                    <span className="font-mono text-5xl font-bold tracking-[0.15em] text-slate-800">
                                        {displayCode || '------'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right Column: QR and Button */}
                        <div className="flex h-[240px] w-full max-w-[240px] flex-col justify-between">
                            <div className="flex w-full grow items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                                <TelegramQRCode code={displayCode} botUrl={botUrl} />
                            </div>

                            <Button
                                className="mt-3 w-full shrink-0 gap-2 bg-telegram font-semibold text-white shadow-md hover:bg-[#1E8CC0]"
                                asChild
                                disabled={!botUrl}
                            >
                                <a
                                    href={
                                        displayCode && botUrl
                                            ? `${botUrl}?start=${displayCode}`
                                            : botUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Send className="size-4" />
                                    Открыть бота
                                </a>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <Button
                            asChild
                            variant="outline"
                            className="mx-auto flex w-full max-w-[504px] gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            <Link to="/auth/login">
                                <Key className="size-4 text-slate-500" />
                                Войти по логину
                            </Link>
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-slate-100 bg-slate-50 py-4">
                    <div
                        className={`flex items-center gap-2 text-sm ${
                            isPollingError ? 'font-medium text-red-500' : 'text-slate-600'
                        }`}
                    >
                        {!isPollingError && (
                            <Loader2 className="size-4 animate-spin text-telegram" />
                        )}
                        <span>{statusMessage}</span>
                    </div>
                </CardFooter>
            </Card>

            <TermsConsent />
        </div>
    );
};

export default TelegramAuth;
