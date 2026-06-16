import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import i18next from 'i18next';
import { useInitTelegramAuthMutation, useLazyCheckTelegramAuthStatusQuery } from '@/api/authAPI';

export function useTelegramAuth() {
    const navigate = useNavigate();
    const [initAuth, { data: initData, isLoading: isInitLoading, error: initError }] =
        useInitTelegramAuthMutation();
    const [checkStatus] = useLazyCheckTelegramAuthStatusQuery();
    const [statusMessage, setStatusMessage] = useState(i18next.t('telegramAuth.generating'));
    const [isPollingError, setIsPollingError] = useState(false);
    const [displayCode, setDisplayCode] = useState<string | undefined>(undefined);

    const botUrl = initData?.bot_url;

    useEffect(() => {
        let isMounted = true;

        const startPolling = async (initialCode: string, token: string) => {
            let currentCode = initialCode;
            while (true) {
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
                        void navigate('/auth/onboarding', {
                            state: { token, code: currentCode },
                            replace: true,
                        });
                        break;
                    } else if (result.status === 'authorized' || result.status === 1) {
                        void navigate('/dashboard', { replace: true });
                        break;
                    } else if (result.status === 'pending' || result.status === 0) {
                        setIsPollingError(false);
                        setStatusMessage(i18next.t('telegramAuth.waitingForCode'));
                    }
                } catch {
                    if (isMounted) {
                        setIsPollingError(true);
                        setStatusMessage(i18next.t('telegramAuth.reconnecting'));
                        await new Promise((resolve) => setTimeout(resolve, 3000));
                    }
                }
            }
        };

        const init = async () => {
            try {
                const res = await initAuth().unwrap();
                if (isMounted) {
                    setIsPollingError(false);
                    setStatusMessage(i18next.t('telegramAuth.waitingForCode'));
                    setDisplayCode(res.code);
                    void startPolling(res.code, res.token);
                }
            } catch {
                if (isMounted) {
                    setIsPollingError(true);
                    setStatusMessage(i18next.t('telegramAuth.connectionError'));
                }
            }
        };

        void init();

        return () => {
            isMounted = false;
        };
    }, [initAuth, checkStatus, navigate]);

    return { displayCode, botUrl, statusMessage, isPollingError, isInitLoading, initError };
}
