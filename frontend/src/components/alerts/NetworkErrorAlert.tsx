import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import type { FC } from 'react';

interface NetworkErrorAlertProps {
    onClose: () => void;
}

const NetworkErrorAlert: FC<NetworkErrorAlertProps> = ({ onClose }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed right-4 bottom-4 z-100 max-w-md animate-in fade-in slide-in-from-bottom-4">
            <Alert variant="destructive" className="border-destructive bg-white shadow-lg">
                <AlertCircle className="size-4" />
                <AlertTitle className="font-bold text-destructive">
                    {t('alerts.networkError.title')}
                </AlertTitle>
                <AlertDescription className="pr-8 text-slate-600">
                    {t('alerts.networkError.description')}
                </AlertDescription>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 size-8 rounded-full hover:bg-slate-100"
                    onClick={onClose}
                >
                    <X className="size-4 text-slate-400" />
                </Button>
            </Alert>
        </div>
    );
};

export default NetworkErrorAlert;
