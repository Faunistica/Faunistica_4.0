import { type FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, PanelLeft, LogOut, Settings as SettingsIcon } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserPhoto } from '@/hooks/useUserPhoto';

interface HeaderProps {
    isSidebarEnabled?: boolean;
    setSidebarOpen?: (isOpen: boolean) => void;
}

const Header: FC<HeaderProps> = ({ isSidebarEnabled, setSidebarOpen }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isLanding, isNavigateEnabled = true } = useRouteHandle();

    const { name, auth, user_id } = useAppSelector((state) => state.user);
    const photoUrl = useUserPhoto(auth ? user_id : null);
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch (e) {
            console.error(e);
        } finally {
            void navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-100 w-full overflow-x-clip border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
            <div className="relative flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-4">
                    {isSidebarEnabled && setSidebarOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-md text-slate-600 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Открыть боковую панель"
                        >
                            <PanelLeft className="size-5" />
                        </Button>
                    )}

                    {isNavigateEnabled && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-md text-slate-600 md:hidden"
                            onClick={() => setIsMobileMenuOpen((v) => !v)}
                            aria-label="Открыть меню"
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? (
                                <X className="size-5" />
                            ) : (
                                <Menu className="size-5" />
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
                                    <Link
                                        to="/instructions"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Инструкция
                                    </Link>
                                </>
                            ) : auth ? (
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
                            ) : (
                                <>
                                    <Link to="/" className="transition-colors hover:text-slate-900">
                                        На главную
                                    </Link>
                                    <Link
                                        to="/instructions"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Инструкция
                                    </Link>
                                </>
                            )}
                        </nav>
                        <div className="flex items-center gap-3">
                            {!auth ? (
                                <Button
                                    asChild
                                    className="bg-slate-900 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                                >
                                    <Link to="/auth/login">Войти</Link>
                                </Button>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="relative size-9 overflow-hidden rounded-full p-0 transition-transform hover:scale-105"
                                        >
                                            <Avatar className="size-9">
                                                {photoUrl && (
                                                    <AvatarImage
                                                        src={photoUrl}
                                                        alt={name || 'Фото профиля'}
                                                    />
                                                )}
                                                <AvatarFallback className="bg-slate-900 text-xs font-bold text-white">
                                                    {name
                                                        ? name.substring(0, 2).toUpperCase()
                                                        : 'US'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-150 w-56">
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm leading-none font-medium text-slate-900">
                                                    {name || 'Пользователь'}
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
                                            <SettingsIcon className="mr-2 size-4" />
                                            <span>Настройки</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                        >
                                            <LogOut className="mr-2 size-4" />
                                            <span>Выйти</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                        >
                                            <LogOut className="mr-2 size-4" />
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
                                <Link
                                    to="/instructions"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Инструкция
                                </Link>
                            </>
                        ) : auth ? (
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
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    На главную
                                </Link>
                                <Link
                                    to="/instructions"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
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
