import {
    createBrowserRouter,
    Navigate,
    Outlet,
    redirect,
    useNavigation,
    useOutletContext,
} from 'react-router';
import { store } from './store/store';
import Spinner from './components/Spinner';
import Layout from './layouts/Layout';

import Landing from './pages/Landing';
import AuthLayout from './pages/Auth';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import TelegramAuth from './pages/Auth/Telegram';
import Recovery from './pages/Auth/Recovery';
import Dashboard from './pages/Dashboard';
import FormFilling from './pages/FormFilling';
import Instructions from './pages/Instructions';
import Statistics from './pages/Statistics';
import Support from './pages/Support';

function NavigationWrapper() {
    const navigation = useNavigation();
    const isNavigating = Boolean(navigation.location);
    const context = useOutletContext();

    if (isNavigating) {
        return <Spinner />;
    }

    return <Outlet context={context} />;
}

const requireAuth = () => {
    const { auth } = store.getState().user;
    console.log('[Router] requireAuth check:', { auth });
    if (!auth) {
        console.log('[Router] Redirecting to login (unauthenticated)');
        return redirect('/auth/login');
    }
    return null;
};

const requireGuest = () => {
    const { auth } = store.getState().user;
    console.log('[Router] requireGuest check:', { auth });
    if (auth) {
        console.log('[Router] Redirecting to dashboard (authenticated)');
        return redirect('/dashboard');
    }
    return null;
};

export const routes = [
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                element: <NavigationWrapper />,
                children: [
                    {
                        index: true,
                        loader: requireGuest,
                        element: <Landing />
                    },

                    {
                        path: 'auth',
                        loader: requireGuest,
                        element: <AuthLayout />,
                        children: [
                            { index: true, element: <Navigate to="login" replace /> },
                            { path: 'login', element: <Login /> },
                            { path: 'register', element: <Register /> },
                            { path: 'telegram', element: <TelegramAuth /> },
                            { path: 'recovery', element: <Recovery /> },
                        ]
                    },

                    {
                        loader: requireAuth,
                        children: [
                            { path: 'dashboard', element: <Dashboard /> },
                            { path: 'article/:id', element: <FormFilling /> },
                            { path: 'instructions', element: <Instructions /> },
                            { path: 'support', element: <Support /> },
                            { path: 'statistics', element: <Statistics /> },
                        ],
                    },
                ],
            },

            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
];

export const router = createBrowserRouter(routes);