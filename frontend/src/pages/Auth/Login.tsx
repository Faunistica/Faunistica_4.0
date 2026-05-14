import { type FC } from 'react';
import { useForm } from 'react-hook-form';

import { Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

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
      navigate(redirectTo || '/dashboard', { replace: true });
    }
  };

  const apiErrorMessage =
    error && 'status' in error
      ? (error.data as { detail?: string })?.detail ?? 'Ошибка входа. Пожалуйста, попробуйте снова.'
      : error
        ? 'Ошибка сети. Пожалуйста, проверьте ваше подключение.'
        : null;

  return (
    <div className="w-full max-w-[400px] space-y-6 mx-auto">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
            Добро пожаловать
          </CardTitle>
          <CardDescription className="text-slate-500">
            Войдите с помощью вашей учётной записи
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button asChild
              variant="outline"
              className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Link to="/auth/telegram">
                <Send className="mr-2 h-4 w-4 text-[#229ED9]" />
                Telegram
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-medium">
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
                {...register('username', { required: 'Email or username is required' })}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link to="/auth/recovery" className="text-sm font-medium text-slate-900 hover:underline">
                  Забыли пароль?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {apiErrorMessage && (
              <p className="text-sm text-red-500 text-center">{apiErrorMessage}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-sm"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col justify-center bg-white border-t border-slate-100 p-4">
          <div className="text-sm text-slate-600">
            Нет аккаунта? <Link to="/auth/register" className="text-slate-900 font-semibold hover:underline">Зарегистрироваться</Link>
          </div>
        </CardFooter>
      </Card>

      <p className="px-4 text-center text-sm text-slate-500 leading-relaxed">
        {"Продолжая, вы соглашаетесь с нашими "}
        <Link to="/terms-of-service" className="underline underline-offset-4 hover:text-slate-900 transition-colors">
          Условиями обслуживания
        </Link>
        {" и "}
        <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-slate-900 transition-colors">
          Политикой конфиденциальности
        </Link>
        {"."}
      </p>
    </div>
  );
};

export default Login;

