// hooks/useRouteHandle.ts
import { useMatches } from 'react-router';

export interface RouteHandle {
    isLanding?: boolean;
    isNavigateEnabled?: boolean;
    isSidebarEnabled?: boolean;
}

export const useRouteHandle = (): RouteHandle => {
    const matches = useMatches();

    let result: RouteHandle = {};

    for (const match of matches) {
        const handle = match?.handle as RouteHandle;
        if (handle) {
            result = {
                ...result,
                ...handle,
            };
        }
    }

    return result;
};
