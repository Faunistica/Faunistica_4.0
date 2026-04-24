import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FC } from 'react';

interface NetworkErrorAlertProps {
    onClose: () => void;
}

const NetworkErrorAlert: FC<NetworkErrorAlertProps> = ({ onClose }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[100] max-w-md animate-in fade-in slide-in-from-bottom-4">
            <Alert variant="destructive" className="bg-white border-destructive shadow-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold text-destructive">Нет доступа к серверу</AlertTitle>
                <AlertDescription className="pr-8 text-slate-600">
                    Не удалось проверить статус авторизации. Часть функций (сохранение данных, работа с анкетой) может быть временно недоступна.
                </AlertDescription>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 hover:bg-slate-100 rounded-full"
                    onClick={onClose}
                >
                    <X className="h-4 w-4 text-slate-400" />
                </Button>
            </Alert>
        </div>
    );
};

export default NetworkErrorAlert;