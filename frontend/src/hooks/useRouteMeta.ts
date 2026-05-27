// hooks/useRouteHandle.ts
import { useMatches } from 'react-router';

export interface RouteHandle {
    isLanding?: boolean;
    isNavigateEnabled?: boolean;
    isSidebarEnabled?: boolean;
}

function isRouteHandle(value: unknown): value is RouteHandle {
    if (typeof value !== 'object' || value === null) return false;
    const obj: Record<string, unknown> = value;
    return (
        obj.isLanding === undefined || typeof obj.isLanding === 'boolean' &&
        obj.isNavigateEnabled === undefined || typeof obj.isNavigateEnabled === 'boolean' &&
        obj.isSidebarEnabled === undefined || typeof obj.isSidebarEnabled === 'boolean'
    );
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
