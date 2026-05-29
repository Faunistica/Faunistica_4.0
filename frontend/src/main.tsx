import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { Provider, useSelector } from 'react-redux';

import { login, logout } from './store/reducers/userSlice.ts';
import { store, type RootState } from './store/store.ts';

import { routes } from './router.tsx';

import LoadingScreen from './components/LoadingScreen.tsx';
import NetworkErrorAlert from './components/alerts/NetworkErrorAlert.tsx';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';

import type * as Types from '@/types/api.dto';

async function verifyAuthInBackground(setNetworkError: (value: boolean) => void) {
    try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            // oxlint-disable-next-line typescript/no-unsafe-assignment
            const user: Types.UserInfo = await response.json();
            store.dispatch(login(user));
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

const App = () => {
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

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <TooltipProvider>
                    <App />
                </TooltipProvider>
            </ThemeProvider>
        </Provider>
    </StrictMode>,
);
