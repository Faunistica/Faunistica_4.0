import { type FC } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

const Recovery: FC = () => {
  return (
    <div className="w-full max-w-[400px] space-y-6 mx-auto">
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
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-sm">
            Send Reset Link
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col justify-center bg-white border-t border-slate-100 p-4">
          <Link to="/auth/login" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
      
      <p className="px-4 text-center text-sm text-slate-500 leading-relaxed">
        Need help? Contact our{' '}
        <Link to="/support" className="underline underline-offset-4 hover:text-slate-900 transition-colors">
          Support
        </Link>.
      </p>
    </div>
  );
};

export default Recovery;
