import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const InstructionImage = ({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) => {
    const { t } = useTranslation();
    const [hasError, setHasError] = useState(false);

    return (
        <div
            className={cn(
                'my-4 overflow-hidden rounded-sm border border-border bg-muted/30',
                className,
            )}
        >
            {hasError ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
                    <Image />
                    <span>{t('instructionImage.error', { src })}</span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className="h-auto w-full object-contain"
                    onError={() => setHasError(true)}
                />
            )}
        </div>
    );
};
