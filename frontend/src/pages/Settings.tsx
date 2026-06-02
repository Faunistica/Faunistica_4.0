import { FC } from 'react';
import { useAppSelector } from '@/store/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Settings: FC = () => {
    const { username, user_id } = useAppSelector((state) => state.user);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 w-full animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">
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
                                className="bg-slate-50 text-slate-500 max-w-[200px]"
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
                        <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-100">
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
