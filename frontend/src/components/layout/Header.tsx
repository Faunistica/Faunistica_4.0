import { type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from "react-router";

interface HeaderProps {
    isSidebarEnabled?: boolean;
    setSidebarOpen?: (isOpen: boolean) => void;
}

const Header: FC<HeaderProps> = ({ isSidebarEnabled, setSidebarOpen }) => {
    // const { auth } = store.getState().user;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const isLanding = location.pathname === '/';
    const isAuth = location.pathname.startsWith('/auth');
    const isPrivate = !isLanding && isAuth; // TODO: Replace with auth state

    return (
        <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="h-16 flex items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-4">
                    {/* Кнопка меню (Sidebar) для FormFilling */}
                    {isSidebarEnabled && setSidebarOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden rounded-md text-slate-600 h-9 w-9"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}

                    {/* Кнопка навигационного меню */}
                    {!isSidebarEnabled && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-md text-slate-600 h-9 w-9"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    )}

                    <div className="text-xl font-black tracking-tight text-slate-900">
                        Faunistica
                    </div>
                </div>

                {!isPrivate && (
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        {isLanding ? (
                            <>
                                <a href="#about" className="hover:text-slate-900 transition-colors">О проекте</a>
                                <a href="#volunteers" className="hover:text-slate-900 transition-colors">Волонтерам</a>
                                <a href="#science" className="hover:text-slate-900 transition-colors">Научная база</a>
                            </>
                        ) : (
                            <>
                                <Link to="/dashboard" className="hover:text-slate-900 transition-colors">Публикации</Link>
                                <Link to="/instructions" className="hover:text-slate-900 transition-colors">Инструкция</Link>
                                <Link to="/statistics" className="hover:text-slate-900 transition-colors">Статистика</Link>
                                <Link to="/support" className="hover:text-slate-900 transition-colors">Поддержка</Link>
                            </>
                        )}
                    </nav>
                )}

                {!isPrivate && (
                    <div className="flex items-center gap-3">
                        {isLanding ? (
                            <Button onClick={() => navigate('/auth/login')} variant="default" className="bg-[#229ED9] text-white hover:bg-[#1E8CC0] shadow-sm">
                                Личный кабинет
                            </Button>
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-sm cursor-pointer hover:bg-slate-800 transition-transform hover:scale-105">
                                Yu
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Мобильное меню навигации */}
            {isMobileMenuOpen && !isSidebarEnabled && !isPrivate && (
                <div className="md:hidden absolute top-16 left-0 right-0 z-30 bg-white border-b border-slate-200 p-4 shadow-xl animate-in slide-in-from-top-2">
                    <nav className="flex flex-col gap-2 text-base font-medium text-slate-700">
                        {isLanding ? (
                            <>
                                <a href="#about" className="p-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>О проекте</a>
                                <a href="#volunteers" className="p-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Волонтерам</a>
                                <a href="#science" className="p-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Научная база</a>
                            </>
                        ) : (
                            <>
                                <Link to="/dashboard" className="p-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Публикации</Link>
                                <Link to="/instructions" className="p-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Инструкция</Link>
                                <Link to="/statistics" className="p-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Статистика</Link>
                                <Link to="/support" className="p-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Поддержка</Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
