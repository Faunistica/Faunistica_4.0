import { type FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, PanelLeft, LogOut, Settings as SettingsIcon, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
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
    const { t, i18n } = useTranslation();

    const { name, auth, user_id } = useAppSelector((state) => state.user);
    const photoUrl = useUserPhoto(auth ? user_id : null);
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ru' ? 'en' : 'ru';
        void i18n.changeLanguage(newLang);
    };

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
                            aria-label={t('header.openSidebar')}
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
                            aria-label={t('header.openMenu')}
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
                                        {t('navigation.about')}
                                    </a>
                                    <a
                                        href="#volunteers"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.volunteers')}
                                    </a>
                                    <a
                                        href="#science"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.science')}
                                    </a>
                                    <Link
                                        to="/instructions"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.instructions')}
                                    </Link>
                                </>
                            ) : auth ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.dashboard')}
                                    </Link>
                                    <Link
                                        to="/instructions"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.instructions')}
                                    </Link>
                                    <Link
                                        to="/statistics"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.statistics')}
                                    </Link>
                                    <Link
                                        to="/support"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.support')}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/" className="transition-colors hover:text-slate-900">
                                        {t('header.backToHome')}
                                    </Link>
                                    <Link
                                        to="/instructions"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        {t('navigation.instructions')}
                                    </Link>
                                </>
                            )}
                        </nav>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 rounded-md text-slate-600"
                                onClick={toggleLanguage}
                                aria-label={t('common.language')}
                            >
                                <Globe className="size-5" />
                            </Button>
                            {!auth ? (
                                <Button
                                    asChild
                                    className="bg-slate-900 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                                >
                                    <Link to="/auth/login">{t('header.loginButton')}</Link>
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
                                                        alt={name || t('header.profilePhoto')}
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
                                                    {name || t('header.user')}
                                                </p>
                                                <p className="text-xs leading-none text-slate-500">
                                                    {t('header.volunteer')}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => navigate('/settings')}
                                            className="cursor-pointer"
                                        >
                                            <SettingsIcon className="mr-2 size-4" />
                                            <span>{t('common.settings')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                        >
                                            <LogOut className="mr-2 size-4" />
                                            <span>{t('common.logout')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                        >
                                            <LogOut className="mr-2 size-4" />
                                            <span>{t('header.logoutEverywhere')}</span>
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
                        <Button
                            variant="ghost"
                            className="flex items-center justify-start gap-2 rounded-md p-3 transition-colors hover:bg-slate-50"
                            onClick={toggleLanguage}
                        >
                            <Globe className="size-5" />
                            {t('common.language')}: {i18n.language === 'ru' ? t('common.russian') : t('common.english')}
                        </Button>
                        {isLanding ? (
                            <>
                                <a
                                    href="#about"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.about')}
                                </a>
                                <a
                                    href="#volunteers"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.volunteers')}
                                </a>
                                <a
                                    href="#science"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.science')}
                                </a>
                                <Link
                                    to="/instructions"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.instructions')}
                                </Link>
                            </>
                        ) : auth ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.dashboard')}
                                </Link>
                                <Link
                                    to="/instructions"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.instructions')}
                                </Link>
                                <Link
                                    to="/statistics"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.statistics')}
                                </Link>
                                <Link
                                    to="/support"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.support')}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('header.backToHome')}
                                </Link>
                                <Link
                                    to="/instructions"
                                    className="rounded-md p-3 transition-colors hover:bg-slate-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navigation.instructions')}
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
