import { Navigate, redirect, type LoaderFunctionArgs, type RouteObject } from 'react-router';
import { store } from './store/store';
import LoadingScreen from './components/LoadingScreen';
import Layout from './layout/Layout';
import { NavigationWrapper } from './components/NavigationWrapper';

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
                        lazy: () =>
                            import('./pages/Landing').then((m) => ({ Component: m.default })),
                        handle: { isLanding: true, isNavigateEnabled: true },
                    },

                    {
                        path: 'privacy-policy',
                        lazy: () =>
                            import('./pages/PrivacyPolicy').then((m) => ({ Component: m.default })),
                    },

                    {
                        path: 'terms-of-service',
                        lazy: () =>
                            import('./pages/TermsOfService').then((m) => ({
                                Component: m.default,
                            })),
                    },

                    {
                        path: 'auth',
                        loader: requireGuest,
                        lazy: () => import('./pages/Auth').then((m) => ({ Component: m.default })),
                        children: [
                            {
                                index: true,
                                element: <Navigate to="login" replace />,
                            },
                            {
                                path: 'login',
                                lazy: () =>
                                    import('./pages/Auth/Login').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                            {
                                path: 'register',
                                lazy: () =>
                                    import('./pages/Auth/Register').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                            {
                                path: 'telegram',
                                lazy: () =>
                                    import('./pages/Auth/Telegram').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                            {
                                path: 'recovery',
                                lazy: () =>
                                    import('./pages/Auth/Recovery').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                        ],
                    },

                    {
                        loader: requireAuth,
                        handle: { isNavigateEnabled: true },
                        children: [
                            {
                                path: 'dashboard',
                                lazy: () =>
                                    import('./pages/Dashboard').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                            {
                                path: 'onboarding',
                                lazy: () =>
                                    import('./pages/Onboarding').then((m) => ({
                                        Component: m.default,
                                    })),
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
                                path: 'instructions',
                                lazy: () =>
                                    import('./pages/Instructions').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                            {
                                path: 'support',
                                lazy: () =>
                                    import('./pages/Support').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                            {
                                path: 'statistics',
                                lazy: () =>
                                    import('./pages/Statistics').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                        ],
                    },
                ],
            },

            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
];
