import { type FC } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useTranslation } from 'react-i18next';

const Register: FC = () => {
    const { t } = useTranslation();
    return (
        <div className="mx-auto w-full max-w-[400px] space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        {t('auth.registerTitle')}
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        {t('auth.registerOnlyTelegram')}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="px-4 py-2 text-center text-sm text-slate-600">
                        {t('auth.registerDescription')}
                    </div>
                    <div className="space-y-3 pt-2">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            <Link to="/auth/telegram">
                                <Send className="size-4 text-[#229ED9]" />
                                {t('auth.registerWithTelegram')}
                            </Link>
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col justify-center border-t border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-600">
                        {t('auth.hasAccount')}{' '}
                        <Link
                            to="/auth/login"
                            className="font-semibold text-slate-900 hover:underline"
                        >
                            {t('auth.loginButton')}
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            <TermsConsent />
        </div>
    );
};

export default Register;
