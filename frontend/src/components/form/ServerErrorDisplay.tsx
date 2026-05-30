import { type FC } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFormSelector } from '@/contexts/RecordFormProvider';

const ServerErrorDisplay: FC = () => {
    const nonFieldErrors = useFormSelector((s) => s.nonFieldErrors);
    if (nonFieldErrors.length === 0) return null;

    return (
        <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                    <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-red-700">Ошибки при сохранении</p>
                        {nonFieldErrors.map((msg, i) => (
                            <p key={i} className="text-sm text-red-600">
                                {msg}
                            </p>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ServerErrorDisplay;
