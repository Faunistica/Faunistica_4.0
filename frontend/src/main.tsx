import { StrictMode, useState, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Provider } from 'react-redux'

import { store } from './store/store.ts'
import { login } from './store/reducers/userSlice.ts'

import { routes } from './router.tsx'
import { createBrowserRouter } from 'react-router'

import Spinner from './components/Spinner'

import './index.css'

/**
 * Before rendering the app, verify the user's session with the server.
 * Since JWTs are stored in HttpOnly cookies, we can't read them in JS —
 * the server is the single source of truth for auth state.
 *
 * We use a raw fetch here (not RTK Query) so that the store is properly
 * hydrated before the router runs its loaders (requireAuth / requireGuest).
 */
async function initAuth() {
    try {
        const response = await fetch('http://localhost:8000/api/auth/check', {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            store.dispatch(login());
            return;
        }

        // Access token expired — try to refresh
        if (response.status === 401) {
            const refreshResponse = await fetch('http://localhost:8000/api/auth/refresh', {
                method: 'POST',
                credentials: 'include',
            });
            if (refreshResponse.ok) {
                store.dispatch(login());
            }
        }
    } catch {
        // Server unreachable — stay logged out
    }
}

const AppRouter = () => {
    const router = useMemo(() => createBrowserRouter(routes), []);
    return <RouterProvider router={router} />;
};

const App = () => {
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        initAuth().finally(() => {
            setIsInitializing(false);
        });
    }, []);

    if (isInitializing) {
        return <Spinner />;
    }

    return <AppRouter />;
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>,
)