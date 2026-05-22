import { type FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Menu,
    X,
    PanelLeft,
    Globe,
    User,
    LogOut,
    Settings as SettingsIcon,
    Check,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useRouteHandle } from '@/hooks/useRouteMeta';
import { useAppSelector } from '@/store/store';
import { useLogoutMutation } from '@/api/authAPI';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
    isSidebarEnabled?: boolean;
    setSidebarOpen?: (isOpen: boolean) => void;
}

const Header: FC<HeaderProps> = ({ isSidebarEnabled, setSidebarOpen }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isLanding, isNavigateEnabled = true } = useRouteHandle();

    const { username, auth } = useAppSelector((state) => state.user);
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();

    const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru');

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch (e) {
            console.error(e);
        } finally {
            navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-[100] w-full overflow-x-clip bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="relative h-16 flex items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-4">
                    {isSidebarEnabled && setSidebarOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden rounded-md text-slate-600 h-9 w-9"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <PanelLeft className="h-5 w-5" />
                        </Button>
                    )}

                    {isNavigateEnabled && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-md text-slate-600 h-9 w-9"
                            onClick={() => setIsMobileMenuOpen((v) => !v)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
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
                        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                            {isLanding ? (
                                <>
                                    <a
                                        href="#about"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        О проекте
                                    </a>
                                    <a
                                        href="#volunteers"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Волонтерам
                                    </a>
                                    <a
                                        href="#science"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Научная база
                                    </a>
                                    <Link
                                        to="/instructions"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Инструкция
                                    </Link>
                                </>
                            ) : auth ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Публикации
                                    </Link>
                                    <Link
                                        to="/instructions"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Инструкция
                                    </Link>
                                    <Link
                                        to="/statistics"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Статистика
                                    </Link>
                                    <Link
                                        to="/support"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Поддержка
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/" className="hover:text-slate-900 transition-colors">
                                        На главную
                                    </Link>
                                    <Link
                                        to="/instructions"
                                        className="hover:text-slate-900 transition-colors"
                                    >
                                        Инструкция
                                    </Link>
                                </>
                            )}
                        </nav>
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-full"
                                    >
                                        <Globe className="h-5 w-5 text-slate-600" />
                                        <span className="sr-only">Сменить язык</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-[150]">
                                    <DropdownMenuItem
                                        onClick={() => handleLanguageChange('ru')}
                                        className="justify-between cursor-pointer"
                                    >
                                        Русский
                                        {language === 'ru' && <Check className="h-4 w-4 ml-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleLanguageChange('en')}
                                        className="justify-between cursor-pointer"
                                    >
                                        English
                                        {language === 'en' && <Check className="h-4 w-4 ml-4" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {!auth ? (
                                <Button
                                    asChild
                                    variant="default"
                                    className="bg-[#229ED9] text-white hover:bg-[#1E8CC0] shadow-sm"
                                >
                                    <Link to="/auth/login">Личный кабинет</Link>
                                </Button>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="relative h-9 w-9 rounded-full p-0 overflow-hidden hover:scale-105 transition-transform"
                                        >
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">
                                                    {username
                                                        ? username.substring(0, 2).toUpperCase()
                                                        : 'US'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 z-[150]">
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none text-slate-900">
                                                    {username || 'Пользователь'}
                                                </p>
                                                <p className="text-xs leading-none text-slate-500">
                                                    Волонтёр
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => navigate('/settings')}
                                            className="cursor-pointer"
                                        >
                                            <SettingsIcon className="mr-2 h-4 w-4" />
                                            <span>Настройки</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Выйти</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Выйти везде</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </>
                )}
            </div>

            {isMobileMenuOpen && isNavigateEnabled && (
                <div className="md:hidden absolute inset-x-0 top-full z-50 bg-white border-b border-slate-200 p-4 shadow-xl animate-in slide-in-from-top-2 overflow-x-clip">
                    <nav className="flex flex-col gap-2 text-base font-medium text-slate-700">
                        {isLanding ? (
                            <>
                                <a
                                    href="#about"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    О проекте
                                </a>
                                <a
                                    href="#volunteers"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Волонтерам
                                </a>
                                <a
                                    href="#science"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Научная база
                                </a>
                                <Link
                                    to="/instructions"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Инструкция
                                </Link>
                            </>
                        ) : auth ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Публикации
                                </Link>
                                <Link
                                    to="/instructions"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Инструкция
                                </Link>
                                <Link
                                    to="/statistics"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Статистика
                                </Link>
                                <Link
                                    to="/support"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Поддержка
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    На главную
                                </Link>
                                <Link
                                    to="/instructions"
                                    className="p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Инструкция
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
