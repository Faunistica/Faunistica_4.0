import { type FC } from 'react';
import { Send, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import { Link } from 'react-router';

const Register: FC = () => {
    return (
        <div className="mx-auto w-full max-w-[400px] space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        Регистрация
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Создание аккаунта доступно только через Telegram
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/*
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" type="text" placeholder="johndoe" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="name@example.com" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <Input id="confirm-password" type="password" />
                        </div>

                        <Button className="mt-2 w-full bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800">
                            Create Account
                        </Button>
                    </div>
                    */}

                    <div className="px-4 py-2 text-center text-sm text-slate-600">
                        В данный момент регистрация новых пользователей возможна только после
                        авторизации через нашего Telegram-бота.
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            <Link to="/auth/telegram">
                                <Send className="size-4 text-[#229ED9]" />
                                Регистрация через Telegram
                            </Link>
                        </Button>

                        {/* <Button
                            asChild
                            variant="outline"
                            className="w-full gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            <Link to="/auth/login">
                                <Key className="size-4 text-slate-500" />
                                Войти по логину
                            </Link>
                        </Button> */}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col justify-center border-t border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-600">
                        Уже есть аккаунт?{' '}
                        <Link
                            to="/auth/login"
                            className="font-semibold text-slate-900 hover:underline"
                        >
                            Войти
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            <p className="px-4 text-center text-sm/relaxed text-slate-500">
                {'Продолжая, вы соглашаетесь с нашими '}
                <Link
                    to="/terms-of-service"
                    className="underline underline-offset-4 transition-colors hover:text-slate-900"
                >
                    Условиями обслуживания
                </Link>
                {' и '}
                <Link
                    to="/privacy-policy"
                    className="underline underline-offset-4 transition-colors hover:text-slate-900"
                >
                    Политикой конфиденциальности
                </Link>
                {'.'}
            </p>
        </div>
    );
};

export default Register;
