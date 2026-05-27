// hooks/useRouteHandle.ts
import { useMatches } from 'react-router';

export interface RouteHandle {
    isLanding?: boolean;
    isNavigateEnabled?: boolean;
    isSidebarEnabled?: boolean;
}

function isRouteHandle(value: unknown): value is RouteHandle {
    if (typeof value !== 'object' || value === null) return false;
    if ('isLanding' in value || 'isNavigateEnabled' in value || 'isSidebarEnabled' in value) {
        return true;
    }
    return false;
}

export const useRouteHandle = (): RouteHandle => {
    const matches = useMatches();

    let result: RouteHandle = {};

    for (const match of matches) {
        const handle = match?.handle;
        if (isRouteHandle(handle)) {
            result = {
                ...result,
                ...handle,
            };
        }
    }

    return result;
};
