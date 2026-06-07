import { type FC, useState } from 'react';
import { Outlet } from 'react-router';
import { useRouteHandle } from '@/hooks/useRouteMeta.ts';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';

const Layout: FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { isLanding, isSidebarEnabled, isFullWidth } = useRouteHandle();

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 font-sans text-slate-900">
            <Header isSidebarEnabled={isSidebarEnabled} setSidebarOpen={setIsSidebarOpen} />

            <div
                className={cn(
                    'relative flex w-full flex-1 overflow-x-clip',
                    isLanding && 'bg-white',
                )}
            >
                {isSidebarEnabled ? (
                    <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
                ) : (
                    <main className="flex w-full min-w-0 flex-1 flex-col">
                        <div
                            className={cn(
                                'w-full overflow-x-clip',
                                isLanding ||
                                    isFullWidth ||
                                    'mx-auto flex max-w-5xl min-w-0 flex-1 flex-col space-y-8 p-4 md:py-8',
                            )}
                        >
                            <Outlet />
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
};

export default Layout;
