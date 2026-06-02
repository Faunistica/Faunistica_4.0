import type { FC } from 'react';
import { Spinner } from '@/components/ui/spinner';

const LoadingScreen: FC = () => {
    return (
        <div className="flex items-center justify-center w-full h-screen">
            <Spinner className="size-10" />
        </div>
    );
};

export default LoadingScreen;
