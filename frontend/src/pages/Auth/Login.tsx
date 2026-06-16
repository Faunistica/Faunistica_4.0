import { type FC } from 'react';
import { useForm } from 'react-hook-form';

import { Send } from 'lucide-react';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';

import { Link, useNavigate, useSearchParams } from 'react-router';

import { authAPI } from '@/api/authAPI';
import TermsConsent from './TermsConsent';
import type { LoginRequest } from '@/types/api.dto';
import { useTranslation } from 'react-i18next';

const Login: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [login, { isLoading, error }] = authAPI.useLoginMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginRequest>();

    const onSubmit = async (data: LoginRequest) => {
        const result = await login(data);
        if (!result.error) {
            const redirectTo = searchParams.get('redirectTo');
            void navigate(redirectTo || '/dashboard', { replace: true });
        }
    };

    const apiErrorMessage = getErrorMessage(error, {
        api: t('auth.loginApiError'),
    });

    return (
        <div className="mx-auto w-full max-w-100 space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        {t('auth.welcome')}
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        {t('auth.welcomeDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            <Link to="/auth/telegram">
                                <Send className="mr-2 size-4 text-[#229ED9]" />
                                Telegram
                            </Link>
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 font-medium text-slate-500">
                                {t('auth.orLoginWith')}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">{t('auth.emailOrUsername')}</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="name@example.com"
                                {...register('username', {
                                    required: 'Email or username is required',
                                })}
                            />
                            {errors.username && (
                                <p className="text-sm text-red-500">{errors.username.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t('auth.password')}</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                {...register('password', {
                                    required: 'Password is required',
                                })}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        {apiErrorMessage && (
                            <p className="text-center text-sm text-red-500">{apiErrorMessage}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800"
                        >
                            {isLoading ? t('auth.loginLoading') : t('auth.loginButton')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col justify-center border-t border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-600">
                        {t('auth.noAccount')}{' '}
                        <Link
                            to="/auth/register"
                            className="font-semibold text-slate-900 hover:underline"
                        >
                            {t('auth.registerButton')}
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            <TermsConsent />
        </div>
    );
};

export default Login;
