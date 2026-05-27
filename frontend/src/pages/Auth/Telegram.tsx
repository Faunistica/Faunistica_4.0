import { type FC } from 'react';
import { Send, Key, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import { Link, useNavigate } from 'react-router';

const TelegramAuth: FC = () => {
    const navigate = useNavigate();

    return (
        <div className="mx-auto w-full max-w-[400px] space-y-6">
            <Card className="relative overflow-hidden border-slate-200 shadow-sm">
                <div className="absolute inset-y-0  left-0 w-1.5 bg-telegram"></div>
                <CardHeader className="space-y-1 pl-6 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        Telegram Secure Login
                    </CardTitle>
                    <CardDescription className="mt-2 text-slate-500">
                        Scan the code with your Telegram app or use the direct link below to access
                        your profile.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="my-4 flex justify-center">
                        <div className="flex size-40  items-center justify-center rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-inner">
                            <div className="flex size-full  flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
                                <Send className="size-8  opacity-50" />
                                <span className="font-mono text-xs">QR / Widget Area</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button className="w-full gap-2 bg-telegram font-semibold text-white shadow-md hover:bg-[#1E8CC0]">
                            <Send className="size-4 " />
                            Log in via Telegram
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 font-medium text-slate-500">or</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                            onClick={() => navigate('/auth/login')}
                        >
                            <Key className="size-4  text-slate-500" />
                            Standard Login
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-slate-100 bg-slate-50 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Loader2 className="size-4  animate-spin text-telegram" />
                        <span>Waiting for authentication...</span>
                    </div>
                </CardFooter>
            </Card>

            <p className="px-4 text-center text-sm/relaxed  text-slate-500">
                By clicking continue, you agree to our{' '}
                <Link
                    to="#"
                    className="underline underline-offset-4 transition-colors hover:text-slate-900"
                >
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                    to="#"
                    className="underline underline-offset-4 transition-colors hover:text-slate-900"
                >
                    Privacy Policy
                </Link>
                .
            </p>
        </div>
    );
};

export default TelegramAuth;
