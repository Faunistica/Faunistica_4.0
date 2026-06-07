import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { FC } from 'react';

interface NetworkErrorAlertProps {
    onClose: () => void;
}

const NetworkErrorAlert: FC<NetworkErrorAlertProps> = ({ onClose }) => {
    return (
        <div className="fixed right-4 bottom-4 z-100 max-w-md animate-in fade-in slide-in-from-bottom-4">
            <Alert variant="destructive" className="border-destructive bg-background shadow-lg">
                <AlertCircle className="size-4" />
                <AlertTitle className="font-bold text-destructive">
                    Нет доступа к серверу
                </AlertTitle>
                <AlertDescription className="pr-8 text-muted-foreground">
                    Не удалось проверить статус авторизации. Часть функций (сохранение данных,
                    работа с анкетой) может быть временно недоступна.
                </AlertDescription>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 size-8 rounded-full hover:bg-accent"
                    onClick={onClose}
                >
                    <X className="size-4 text-muted-foreground" />
                </Button>
            </Alert>
        </div>
    );
};

export default NetworkErrorAlert;
