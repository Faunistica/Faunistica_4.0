import { Navigate, redirect, type LoaderFunctionArgs, type RouteObject } from 'react-router';
import { store } from './store/store';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/layout/Layout';
import { NavigationWrapper } from './components/NavigationWrapper';
import Landing from './pages/Landing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Instructions from './pages/Instructions';
import Auth from './pages/Auth';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import TelegramAuth from './pages/Auth/Telegram';
import Recovery from './pages/Auth/Recovery';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Support from './pages/Support';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

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
                        Component: Landing,
                        handle: { isLanding: true, isNavigateEnabled: true },
                    },

                    {
                        path: 'privacy-policy',
                        Component: PrivacyPolicy,
                    },

                    {
                        path: 'terms-of-service',
                        Component: TermsOfService,
                    },

                    {
                        path: 'instructions',
                        Component: Instructions,
                        handle: { isFullWidth: true },
                    },

                    {
                        path: 'auth',
                        loader: requireGuest,
                        Component: Auth,
                        handle: { isNavigateEnabled: false },
                        children: [
                            {
                                index: true,
                                element: <Navigate to="login" replace />,
                            },
                            {
                                path: 'login',
                                Component: Login,
                            },
                            {
                                path: 'register',
                                Component: Register,
                            },
                            {
                                path: 'telegram',
                                Component: TelegramAuth,
                            },
                            {
                                path: 'recovery',
                                Component: Recovery,
                            },
                        ],
                    },

                    {
                        loader: requireAuth,
                        handle: { isNavigateEnabled: true },
                        children: [
                            {
                                path: 'dashboard',
                                Component: Dashboard,
                            },
                            {
                                path: 'onboarding',
                                Component: Onboarding,
                                handle: { isNavigateEnabled: false },
                            },
                            {
                                path: 'publication/:id/:record?',
                                lazy: () =>
                                    import('./pages/FormFilling').then((m) => ({
                                        Component: m.default,
                                    })),
                                handle: { isSidebarEnabled: true },
                            },
                            {
                                path: 'support',
                                Component: Support,
                            },
                            {
                                path: 'statistics',
                                Component: Statistics,
                            },
                            {
                                path: 'settings',
                                Component: Settings,
                                handle: { isFullWidth: true },
                            },
                        ],
                    },
                ],
            },

            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
];
