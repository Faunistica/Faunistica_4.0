import { type FC } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    errors: string[];
}

const ServerErrorDisplay: FC<Props> = ({ errors }) => {
    if (errors.length === 0) return null;

    return (
        <Card className="border-red-200 shadow-sm bg-red-50">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-red-700">Ошибки при сохранении</p>
                        {errors.map((msg, i) => (
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
