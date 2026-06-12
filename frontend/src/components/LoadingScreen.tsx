import type { FC } from 'react';
import { Spinner } from '@/components/ui/spinner';

const LoadingScreen: FC = () => {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Spinner className="size-10" />
        </div>
    );
};

export default LoadingScreen;
