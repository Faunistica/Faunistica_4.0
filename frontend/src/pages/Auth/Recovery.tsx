import { type FC } from 'react';
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
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

const Recovery: FC = () => {
    return (
        <div className="mx-auto w-full max-w-[400px] space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        Forgot password?
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="name@example.com" />
                    </div>
                    <Button className="w-full bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800">
                        Send Reset Link
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col justify-center border-t border-slate-100 bg-white p-4">
                    <Link
                        to="/auth/login"
                        className="flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="mr-2 size-4" />
                        Back to login
                    </Link>
                </CardFooter>
            </Card>

            <p className="px-4 text-center text-sm/relaxed text-slate-500">
                Need help? Contact our{' '}
                <Link
                    to="/support"
                    className="underline underline-offset-4 transition-colors hover:text-slate-900"
                >
                    Support
                </Link>
                .
            </p>
        </div>
    );
};

export default Recovery;
