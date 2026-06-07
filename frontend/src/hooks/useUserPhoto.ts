import { useEffect, useState } from 'react';
import { useGetPhotoQuery } from '@/api/userAPI';

/**
 * Возвращает `object URL` фотографии профиля текущего пользователя.
 *
 * Если `userId` не задан — возвращает `null` и не выполняет запрос.
 * Если у пользователя нет фото (HTTP 404 / ошибка сети) — тоже `null`.
 */
export function useUserPhoto(userId: number | null): string | null {
    const { data: blob } = useGetPhotoQuery(undefined, { skip: userId == null });
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!blob) {
            // oxlint-disable-next-line react-hooks-js/set-state-in-effect
            setPhotoUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return undefined;
        }
        const url = URL.createObjectURL(blob);
        // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        setPhotoUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
        });
        return () => URL.revokeObjectURL(url);
    }, [blob]);

    return userId == null ? null : photoUrl;
}
