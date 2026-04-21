import { type FC } from 'react';
import { Send, Key, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Link, useNavigate } from 'react-router';

const TelegramAuth: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[400px] space-y-6 mx-auto">
      <Card className="border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-telegram"></div>
        <CardHeader className="space-y-1 text-center pl-6">
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
            Telegram Secure Login
          </CardTitle>
          <CardDescription className="text-slate-500 mt-2">
            Scan the code with your Telegram app or use the direct link below to access your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="flex justify-center my-4">
            <div className="h-40 w-40 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-inner">
              <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
                <Send className="h-8 w-8 opacity-50" />
                <span className="text-xs font-mono">QR / Widget Area</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button className="w-full bg-telegram text-white hover:bg-[#1E8CC0] font-semibold shadow-md gap-2">
              <Send className="h-4 w-4" />
              Log in via Telegram
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-medium">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 gap-2"
              onClick={() => navigate('/auth/login')}
            >
              <Key className="h-4 w-4 text-slate-500" />
              Standard Login
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center bg-slate-50 border-t border-slate-100 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-telegram" />
            <span>Waiting for authentication...</span>
          </div>
        </CardFooter>
      </Card>

      <p className="px-4 text-center text-sm text-slate-500 leading-relaxed">
        By clicking continue, you agree to our{' '}
        <Link to="#" className="underline underline-offset-4 hover:text-slate-900 transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="#" className="underline underline-offset-4 hover:text-slate-900 transition-colors">
          Privacy Policy
        </Link>.
      </p>
    </div>
  );
};

export default TelegramAuth;
