import type { ApiErrorBody } from '@/types/api.dto';

const DEFAULTS = {
    api: 'Неизвестная ошибка',
    network: 'Ошибка сети. Пожалуйста, проверьте ваше подключение.',
} as const;

interface ErrorFallbacks {
    api?: string;
    network?: string;
}

export function getErrorMessage(error: null | undefined, fallbacks?: ErrorFallbacks): null;
export function getErrorMessage(
    error: { data?: ApiErrorBody } | { message?: string },
    fallbacks?: ErrorFallbacks,
): string;
export function getErrorMessage(
    error: { data?: ApiErrorBody } | { message?: string } | null | undefined,
    fallbacks?: ErrorFallbacks,
): string | null;
export function getErrorMessage(
    error: { data?: ApiErrorBody } | { message?: string } | null | undefined,
    fallbacks: ErrorFallbacks = {},
): string | null {
    const { api = DEFAULTS.api, network = DEFAULTS.network } = fallbacks;

    if (!error) return null;

    if ('data' in error) {
        if (error.data?.message) return error.data.message;
        if (error.data?.detail) return String(error.data.detail);
        if (error.data?.error) return error.data.error;
        return api;
    }

    return 'message' in error && typeof error.message === 'string' ? error.message : network;
}
