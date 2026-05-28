import { type FC } from 'react';
import { Outlet } from 'react-router';

const AuthLayout: FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
            <Outlet />
        </div>
    );
};

export default AuthLayout;
