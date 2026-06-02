import type { FC } from 'react';
import { useAppSelector } from '@/store/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Settings: FC = () => {
    const { username, user_id } = useAppSelector((state) => state.user);

    return (
        <div className="mx-auto w-full max-w-4xl animate-in px-4 py-8 duration-500 fade-in">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">
                Настройки профиля
            </h1>

            <div className="grid gap-8">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Личные данные</CardTitle>
                        <CardDescription>Основная информация о вашем аккаунте</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Имя пользователя</Label>
                            <Input
                                id="username"
                                value={username || ''}
                                disabled
                                className="bg-slate-50 text-slate-500"
                            />
                            <p className="text-xs text-slate-500">
                                Имя пользователя используется для входа в систему и не может быть
                                изменено.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="userId">ID пользователя</Label>
                            <Input
                                id="userId"
                                value={user_id || ''}
                                disabled
                                className="max-w-[200px] bg-slate-50 text-slate-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Предпочтения</CardTitle>
                        <CardDescription>
                            Настройки интерфейса и уведомлений (в разработке)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                            Дополнительные настройки профиля и системы будут доступны в будущих
                            обновлениях.
                        </div>
                        <Button disabled>Сохранить изменения</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
