import { Navigate, redirect, type LoaderFunctionArgs, type RouteObject } from 'react-router';
import { store } from './store/store';
import { publAPI } from './api/publAPI';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/layout/Layout';
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

const requireInteractablePublication = async ({ params }: LoaderFunctionArgs) => {
    const { id } = params;
    if (!id) return redirect('/dashboard');

    const publ_id = Number(id);
    if (Number.isNaN(publ_id)) return redirect('/dashboard');

    const promise = store.dispatch(publAPI.endpoints.getPublicationById.initiate(publ_id));

    try {
        const result = await promise.unwrap();
        if (!result.interactable) return redirect('/dashboard');
        return null;
    } catch {
        return redirect('/dashboard');
    } finally {
        promise.unsubscribe();
    }
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
                        path: 'instructions',
                        lazy: () =>
                            import('./pages/Instructions').then((m) => ({
                                Component: m.default,
                            })),
                        handle: { isFullWidth: true },
                    },

                    {
                        path: 'auth',
                        loader: requireGuest,
                        lazy: () => import('./pages/Auth').then((m) => ({ Component: m.default })),
                        handle: { isNavigateEnabled: false },
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
                                path: 'publication/:id/submit',
                                loader: requireInteractablePublication,
                                lazy: () =>
                                    import('./pages/SubmitPublication').then((m) => ({
                                        Component: m.default,
                                    })),
                            },
                            {
                                path: 'publication/:id/:record?',
                                loader: requireInteractablePublication,
                                lazy: () =>
                                    import('./pages/FormFilling').then((m) => ({
                                        Component: m.default,
                                    })),
                                handle: { isSidebarEnabled: true },
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
                            {
                                path: 'settings',
                                lazy: () =>
                                    import('./pages/Settings').then((m) => ({
                                        Component: m.default,
                                    })),
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
