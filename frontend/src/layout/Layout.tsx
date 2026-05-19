import { type FC, useState } from 'react';
import { Outlet } from 'react-router';
import { useRouteHandle } from '@/hooks/useRouteMeta.ts';
import Header from '@/layout/Header';

const Layout: FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { isLanding, isSidebarEnabled } = useRouteHandle();

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 font-sans text-slate-900">
            <Header isSidebarEnabled={isSidebarEnabled} setSidebarOpen={setIsSidebarOpen} />

            <div
                className={`relative flex flex-1 w-full overflow-x-clip ${isLanding ? 'bg-white' : ''}`}
            >
                {isSidebarEnabled ? (
                    <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
                ) : (
                    <main className="flex min-w-0 flex-1 flex-col w-full">
                        <div
                            className={
                                isLanding
                                    ? 'w-full overflow-x-clip'
                                    : 'flex min-w-0 flex-col flex-1 w-full max-w-5xl mx-auto p-4 md:py-8 space-y-8 overflow-x-clip'
                            }
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
