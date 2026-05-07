import {
    Navigate,
    Outlet,
    redirect,
    useNavigation,
    useOutletContext,
    ScrollRestoration,
    type LoaderFunctionArgs, type RouteObject
} from 'react-router';
import { store } from './store/store';
import LoadingScreen from './components/LoadingScreen';
import Layout from './layout/Layout';

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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Onboarding from './pages/Onboarding';

import { Toaster } from "sonner";

function NavigationWrapper() {
    const navigation = useNavigation();
    const isNavigating = Boolean(navigation.location);
    const context = useOutletContext();

    if (isNavigating) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Toaster position="bottom-right" />
            <ScrollRestoration />
            <Outlet context={context} />
        </>
    )
}

const requireAuth = ({ request }: LoaderFunctionArgs) => {
    const { auth } = store.getState().user;
    if (!auth) {
        const url = new URL(request.url);
        const redirectTo = url.pathname + url.search;
        return redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
    return null;
};

const requireGuest = ({ request }: LoaderFunctionArgs) => {
    const { auth } = store.getState().user;
    if (auth) {
        const url = new URL(request.url);
        const redirectTo = url.searchParams.get('redirectTo');
        return redirect(redirectTo || '/dashboard');
    }
    return null;
};

export const routes: RouteObject[] = [
    {
        path: '/',
        element: <NavigationWrapper />,
        HydrateFallback: LoadingScreen,
        children: [
            {
                element: <Layout />,
                children: [
                    {
                        index: true,
                        loader: requireGuest,
                        element: <Landing />,
                        handle: { isLanding: true, isNavigateEnabled: true }
                    },

                    {
                        path: 'privacy-policy',
                        element: <PrivacyPolicy />
                    },

                    {
                        path: 'terms-of-service',
                        element: <TermsOfService />
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
                        handle: { isNavigateEnabled: true },
                        children: [
                            { path: 'dashboard', element: <Dashboard /> },
                            { path: 'onboarding', element: <Onboarding />, handle: { isNavigateEnabled: false } },
                            { path: 'publication/:id', element: <FormFilling />, handle: { isSidebarEnabled: true } },
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