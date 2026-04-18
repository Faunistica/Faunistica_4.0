import { type FC, useState } from "react";
import { Outlet, useLocation } from "react-router";
import Header from "@/components/layout/Header";

const Layout: FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const isFormFilling = location.pathname.includes('/article/');
    const isLanding = location.pathname === '/';

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            <Header
                isSidebarEnabled={isFormFilling}
                setSidebarOpen={setIsSidebarOpen}
            />

            <div className={`flex-1 flex max-w-[100vw] relative ${isLanding ? 'bg-white' : ''}`}>
                {isFormFilling ? (
                    <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
                ) : (
                    <main className={`flex-1 flex flex-col w-full min-h-0`}>
                        <div className={isLanding ? 'w-full' : 'flex-1 w-full max-w-5xl mx-auto p-4 md:py-8 space-y-8'}>
                            <Outlet />
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
};

export default Layout;