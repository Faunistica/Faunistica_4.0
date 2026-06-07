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
import type { LoginRequest } from '@/types/api.dto';

const Login: FC = () => {
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
        api: 'Ошибка входа. Пожалуйста, попробуйте снова.',
    });

    return (
        <div className="mx-auto w-full max-w-100 space-y-6">
            <Card className="border-border shadow-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                        Добро пожаловать
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Войдите с помощью вашей учётной записи
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full border-border bg-background text-foreground hover:bg-accent"
                        >
                            <Link to="/auth/telegram">
                                <Send className="mr-2 size-4 text-[#229ED9]" />
                                Telegram
                            </Link>
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 font-medium text-muted-foreground">
                                Или войдите с помощью
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Email или логин</Label>
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
                                <Label htmlFor="password">Пароль</Label>
                                {/* <Link
                                    to="/auth/recovery"
                                    className="text-sm font-medium text-slate-900 hover:underline"
                                >
                                    Забыли пароль?
                                </Link> */}
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
                            className="w-full bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                        >
                            {isLoading ? 'Вход...' : 'Войти'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col justify-center border-t border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">
                        Нет аккаунта?{' '}
                        <Link
                            to="/auth/register"
                            className="font-semibold text-foreground hover:underline"
                        >
                            Зарегистрироваться
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            <p className="px-4 text-center text-sm/relaxed text-muted-foreground">
                {'Продолжая, вы соглашаетесь с нашими '}
                <Link
                    to="/terms-of-service"
                    className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                    Условиями обслуживания
                </Link>
                {' и '}
                <Link
                    to="/privacy-policy"
                    className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                    Политикой конфиденциальности
                </Link>
                {'.'}
            </p>
        </div>
    );
};

export default Login;
