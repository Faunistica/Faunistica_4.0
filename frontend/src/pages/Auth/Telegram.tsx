import { type FC, useEffect, useState, useRef } from 'react';
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
import { Link, useNavigate } from 'react-router';
import { useInitTelegramAuthMutation, useLazyCheckTelegramAuthStatusQuery } from '@/api/authAPI';
import QRCodeStyling from 'qr-code-styling';

export const TelegramQRCode = ({ code, botUrl }: { code?: string; botUrl?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [qrCode] = useState<QRCodeStyling>(
        () =>
            new QRCodeStyling({
                width: 180,
                height: 180,
                type: 'svg',
                // Base64 encoded Telegram SVG icon
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzIyOUVEOSIgZD0iTTEyIDBDNS4zNzMgMCAwIDUuMzczIDAgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTJTMTguNjI3IDAgMTIgMHptNS44OTQgOC4yMjFsLTEuOTcgOS4yOGMtLjE0NS42NTgtLjUzNy44MTgtMS4wODQuNTA4bC0zLTIuMjEtMS40NDYgMS4zOTRjLS4xNC4xOC0uMzU3LjI5NS0uNi4yOTUtLjAwMiAwLS4wMDMgMC0uMDA1IDBsLjIxMy0zLjA1NCA1LjU2LTUuMDIyYy4yNC0uMjEzLS4wNTQtLjMzNC0uMzczLS4xMjFsLTYuODY5IDQuMzI2LTIuOTYtLjkyNGMtLjY0LS4yMDMtLjY1OC0uNjQuMTM1LS45NTRsMTEuNTY2LTQuNDU4Yy41MzgtLjE5NiAxLjAwNi4xMjguODMyLjk0eiIvPjwvc3ZnPg==',
                dotsOptions: {
                    color: '#1e293b', // slate-800
                    type: 'classy-rounded', // Elegant, organic leaf-like appearance
                },
                cornersSquareOptions: {
                    type: 'extra-rounded',
                    color: '#1e293b',
                },
                cornersDotOptions: {
                    type: 'dot',
                    color: '#1e293b',
                },
                backgroundOptions: {
                    color: 'transparent',
                },
                imageOptions: {
                    crossOrigin: 'anonymous',
                    margin: 4,
                    imageSize: 0.35,
                },
            }),
    );

    useEffect(() => {
        if (ref.current && ref.current.childElementCount === 0) {
            qrCode.append(ref.current);
        }
    }, [qrCode]);

    useEffect(() => {
        if (!botUrl) return;
        // If we have a code, append it to the deep link so scanning the QR code auto-sends the start command
        const fullUrl = code ? `${botUrl}?start=${code}` : botUrl;
        qrCode.update({ data: fullUrl });
    }, [code, qrCode, botUrl]);

    return <div ref={ref} className="flex items-center justify-center" />;
};

const TelegramAuth: FC = () => {
    const navigate = useNavigate();
    const [initAuth, { data: initData, isLoading: isInitLoading, error: initError }] =
        useInitTelegramAuthMutation();
    const [checkStatus] = useLazyCheckTelegramAuthStatusQuery();
    const [statusMessage, setStatusMessage] = useState('Генерация кода...');
    const [isPollingError, setIsPollingError] = useState(false);
    const [displayCode, setDisplayCode] = useState<string | undefined>(undefined);

    const botUrl = initData?.bot_url;

    useEffect(() => {
        let isMounted = true;

        const startPolling = async (initialCode: string, token: string) => {
            let currentCode = initialCode;
            while (isMounted) {
                try {
                    const result = await checkStatus(
                        { code: currentCode, token, timeout: 25 },
                        false,
                    ).unwrap();
                    if (!isMounted) break;

                    if (result.code && !result.status && result.status !== 0) {
                        currentCode = result.code;
                        setDisplayCode(currentCode);
                        continue;
                    }

                    if (result.status === 'need_registration' || result.status === 2) {
                        navigate('/auth/onboarding', {
                            state: { token, code: currentCode },
                            replace: true,
                        });
                        break;
                    } else if (result.status === 'authorized' || result.status === 1) {
                        navigate('/dashboard', { replace: true });
                        break;
                    } else if (result.status === 'pending' || result.status === 0) {
                        setIsPollingError(false);
                        setStatusMessage('Ожидание ввода кода в Telegram...');
                    }
                } catch (e: any) {
                    if (isMounted) {
                        setIsPollingError(true);
                        setStatusMessage('Проблема с подключением, пытаемся восстановить...');
                        await new Promise((resolve) => setTimeout(resolve, 3000));
                    }
                }
            }
        };

        initAuth()
            .unwrap()
            .then((res) => {
                if (isMounted) {
                    setIsPollingError(false);
                    setStatusMessage('Ожидание ввода кода в Telegram...');
                    setDisplayCode(res.code);
                    startPolling(res.code, res.token);
                }
            })
            .catch((err) => {
                console.error('Failed to init auth', err);
                if (isMounted) {
                    setIsPollingError(true);
                    setStatusMessage('Ошибка соединения. Пожалуйста, попробуйте еще раз.');
                }
            });

        return () => {
            isMounted = false;
        };
    }, [initAuth, checkStatus, navigate]);

    return (
        <div className="mx-auto w-full max-w-[700px] space-y-6">
            <Card className="relative overflow-hidden border-slate-200 shadow-sm">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-telegram"></div>
                <CardHeader className="space-y-1 pl-6 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        Вход через Telegram
                    </CardTitle>
                    <CardDescription className="mx-auto mt-2 max-w-md text-slate-500">
                        Отправьте этот код сообщением нашему Telegram боту{' '}
                        <a
                            href={botUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-telegram hover:underline"
                        >
                            @{botUrl?.replace(/^https?:\/\/t\.me\//, '')}
                        </a>
                        , не закрывая данную страницу
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
                        className={`flex items-center gap-2 text-sm ${isPollingError ? 'font-medium text-red-500' : 'text-slate-600'
                            }`}
                    >
                        {!isPollingError && (
                            <Loader2 className="size-4 animate-spin text-telegram" />
                        )}
                        <span>{statusMessage}</span>
                    </div>
                </CardFooter>
            </Card>

            <p className="px-4 text-center text-sm/relaxed text-slate-500">
                {'Продолжая, вы соглашаетесь с нашими '}
                <Link
                    to="/terms-of-service"
                    className="underline underline-offset-4 transition-colors hover:text-slate-900"
                >
                    Условиями обслуживания
                </Link>
                {' и '}
                <Link
                    to="/privacy-policy"
                    className="underline underline-offset-4 transition-colors hover:text-slate-900"
                >
                    Политикой конфиденциальности
                </Link>
                {'.'}
            </p>
        </div>
    );
};

export default TelegramAuth;
