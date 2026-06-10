import { type FC } from 'react';
import { Send } from 'lucide-react';
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
import TermsConsent from './TermsConsent';

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

            <TermsConsent />
        </div>
    );
};

export default Register;
