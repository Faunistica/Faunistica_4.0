import { type FC, useState } from 'react';
import { Outlet } from 'react-router';
import { cn } from '@/lib/utils';
import { useRouteHandle } from '@/hooks/useRouteMeta.ts';
import Header from '@/layout/Header';

const Layout: FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { isLanding, isSidebarEnabled } = useRouteHandle();

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
                                isLanding
                                    ? 'w-full overflow-x-clip'
                                    : 'mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col space-y-8 overflow-x-clip p-4 md:py-8',
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
