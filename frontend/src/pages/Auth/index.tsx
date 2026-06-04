import { type FC } from 'react';
import { Outlet } from 'react-router';

const AuthLayout: FC = () => {
    return (
        <div className="flex min-h-[calc(100vh-100px)] flex-1 flex-col items-center justify-center">
            <Outlet />
        </div>
    );
};

export default AuthLayout;
