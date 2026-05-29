import { useEffect, useMemo, useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { useSelector } from 'react-redux';

import { routes } from '@/router.tsx';

import { login, logout } from '@/store/reducers/userSlice.ts';
import { store, type RootState } from '@/store/store.ts';

import NetworkErrorAlert from '@/components/alerts/NetworkErrorAlert.tsx';
import LoadingScreen from '@/components/LoadingScreen.tsx';

import type * as Types from '@/types/api.dto';

function isUserInfo(value: unknown): value is Types.UserInfo {
    return typeof value === 'object' && value !== null && 'user_id' in value && 'name' in value;
}

async function verifyAuthInBackground(setNetworkError: (value: boolean) => void) {
    try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            const data: unknown = await response.json();
            if (isUserInfo(data)) {
                store.dispatch(login(data));
            }
            return;
        }

        if (response.status === 401) {
            const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (refreshResponse.ok) {
                return;
            }
        }

        store.dispatch(logout());
    } catch {
        store.dispatch(logout());
        setNetworkError(true);
    }
}

const AppRouter = () => {
    const router = useMemo(() => createBrowserRouter(routes), []);
    return <RouterProvider router={router} />;
};

export const App = () => {
    const auth = useSelector((state: RootState) => state.user.auth);
    const [networkError, setNetworkError] = useState(false);

    useEffect(() => {
        void verifyAuthInBackground(setNetworkError);
    }, []);

    if (auth === null) {
        return <LoadingScreen />;
    }

    return (
        <>
            {networkError && <NetworkErrorAlert onClose={() => setNetworkError(false)} />}
            <AppRouter />
        </>
    );
};
