import { Outlet, ScrollRestoration, useNavigation, useOutletContext } from 'react-router';
import LoadingScreen from './LoadingScreen';
import { Toaster } from 'sonner';

export function NavigationWrapper() {
    const navigation = useNavigation();
    const isNavigating = Boolean(navigation.location);
    const context = useOutletContext();

    console.log(navigation.location);

    if (isNavigating) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Toaster position="bottom-right" />
            <ScrollRestoration />
            <Outlet context={context} />
        </>
    );
}
