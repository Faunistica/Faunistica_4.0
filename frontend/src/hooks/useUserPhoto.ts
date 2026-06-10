import { useEffect, useState } from 'react';
import { useGetPhotoQuery } from '@/api/userAPI';

const CACHE_KEY = 'userPhotoCache';

interface PhotoCache {
    userId: number;
    dataUrl: string;
}

function isPhotoCache(value: unknown): value is PhotoCache {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as { userId?: unknown; dataUrl?: unknown };
    return typeof v.userId === 'number' && typeof v.dataUrl === 'string';
}

function readCache(userId: number | null): string | null {
    if (userId == null) return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isPhotoCache(parsed)) return null;
        return parsed.userId === userId ? parsed.dataUrl : null;
    } catch {
        return null;
    }
}

function writeCache(userId: number, dataUrl: string): void {
    try {
        const value: PhotoCache = { userId, dataUrl };
        localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    } catch {
        // localStorage недоступен или квота исчерпана — пропускаем
    }
}

export function clearUserPhotoCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch {
        // ignore
    }
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('Unexpected FileReader result'));
        });
        reader.addEventListener('error', () => reject(reader.error));
        reader.readAsDataURL(blob);
    });
}

/**
 * Возвращает `data URL` фотографии профиля текущего пользователя.
 *
 * Чтобы избежать повторной загрузки при переходе между страницами,
 * blob после первого получения кэшируется в `localStorage` по `userId`
 * и сразу отдаётся синхронно на последующих монтированиях.
 */
export function useUserPhoto(userId: number | null): string | null {
    const { data: blob } = useGetPhotoQuery(undefined, { skip: userId == null });
    const [photoUrl, setPhotoUrl] = useState<string | null>(() => readCache(userId));

    useEffect(() => {
        // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        setPhotoUrl(readCache(userId));
    }, [userId]);

    useEffect(() => {
        if (userId == null || !blob) return undefined;
        let cancelled = false;
        void blobToDataUrl(blob).then((dataUrl) => {
            if (cancelled) return undefined;
            writeCache(userId, dataUrl);
            setPhotoUrl(dataUrl);
            return undefined;
        });
        return () => {
            cancelled = true;
        };
    }, [blob, userId]);

    return userId == null ? null : photoUrl;
}
