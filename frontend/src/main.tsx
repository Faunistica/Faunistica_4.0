import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { Provider, useSelector } from 'react-redux';

import { login, logout } from './store/reducers/userSlice.ts';
import { store, type RootState } from './store/store.ts';

import { routes } from './router.tsx';

import LoadingScreen from './components/LoadingScreen.tsx';
import NetworkErrorAlert from './components/alerts/NetworkErrorAlert.tsx';

import type * as Types from '@/types/api.dto';

import './index.css';

async function verifyAuthInBackground(setNetworkError: (value: boolean) => void) {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            const user: Types.UserInfo = await response.json();
            store.dispatch(login(user));
            return;
        }

        if (response.status === 401) {
            const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (refreshResponse.ok) {
                return;
            }
        }

        store.dispatch(logout());
    } catch (error) {
        store.dispatch(logout());
        setNetworkError(true);
    }
}

const AppRouter = () => {
    const auth = useSelector((state: RootState) => state.user.auth);

    const router = useMemo(() => createBrowserRouter(routes), [auth]);
    return <RouterProvider router={router} />;
};

const App = () => {
    const auth = useSelector((state: RootState) => state.user.auth);
    const [networkError, setNetworkError] = useState(false);

    useEffect(() => {
        verifyAuthInBackground(setNetworkError);
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
            <App />
        </Provider>
    </StrictMode>,
);
