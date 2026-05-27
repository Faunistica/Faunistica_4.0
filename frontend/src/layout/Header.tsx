import { type FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, PanelLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useRouteHandle } from '@/hooks/useRouteMeta';

interface HeaderProps {
    isSidebarEnabled?: boolean;
    setSidebarOpen?: (isOpen: boolean) => void;
}

const Header: FC<HeaderProps> = ({ isSidebarEnabled, setSidebarOpen }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { isLanding, isNavigateEnabled } = useRouteHandle();

    return (
        <header className="sticky top-0 z-200 w-full overflow-x-clip border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
            <div className="relative flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-4">
                    {isSidebarEnabled && setSidebarOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9  rounded-md text-slate-600 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <PanelLeft className="size-5 " />
                        </Button>
                    )}

                    {isNavigateEnabled && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9  rounded-md text-slate-600 md:hidden"
                            onClick={() => setIsMobileMenuOpen((v) => !v)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="size-5 " />
                            ) : (
                                <Menu className="size-5 " />
                            )}
                        </Button>
                    )}
                    <Link to="/">
                        <div className="text-xl font-black tracking-tight text-slate-900">
                            Faunistics
                        </div>
                    </Link>
                </div>

                {isNavigateEnabled && (
                    <>
                        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
                            {isLanding ? (
                                <>
                                    <a
                                        href="#about"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        О проекте
                                    </a>
                                    <a
                                        href="#volunteers"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Волонтерам
                                    </a>
                                    <a
                                        href="#science"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Научная база
                                    </a>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Публикации
                                    </Link>
                                    <Link
                                        to="/instructions"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Инструкция
                                    </Link>
                                    <Link
                                        to="/statistics"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Статистика
                                    </Link>
                                    <Link
                                        to="/support"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Поддержка
                                    </Link>
                                </>
                            )}
                        </nav>
                        <div className="flex items-center gap-3">
                            {isLanding ? (
                                <Button
                                    asChild
                                    variant="default"
                                    className="bg-[#229ED9] text-white shadow-sm hover:bg-[#1E8CC0]"
                                >
                                    <Link to="/auth/login">Личный кабинет</Link>
                                </Button>
                            ) : (
                                <div className="flex size-9  cursor-pointer items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 hover:bg-slate-800">
                                    Yu
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {isMobileMenuOpen && isNavigateEnabled && (
                <div className="absolute inset-x-0 top-full z-50 animate-in overflow-x-clip border-b border-slate-200 bg-white p-4 shadow-xl slide-in-from-top-2 md:hidden">
                    <nav className="flex flex-col gap-2 text-base font-medium text-slate-700">
                        {isLanding ? (
                            <>
                                <a
                                    href="#about"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    О проекте
                                </a>
                                <a
                                    href="#volunteers"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Волонтерам
                                </a>
                                <a
                                    href="#science"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Научная база
                                </a>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Публикации
                                </Link>
                                <Link
                                    to="/instructions"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Инструкция
                                </Link>
                                <Link
                                    to="/statistics"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Статистика
                                </Link>
                                <Link
                                    to="/support"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Поддержка
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
