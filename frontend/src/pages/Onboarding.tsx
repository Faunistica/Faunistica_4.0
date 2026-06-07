import { FileText, Languages, UserCheck, Settings2, KeyRound, User, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRegisterMutation } from '@/api/authAPI';

const formSchema = z
    .object({
        name: z.string().min(2, 'Минимум 2 символа'),
        username: z.string().min(3, 'Минимум 3 символа'),
        password: z.string().min(6, 'Минимум 6 символов'),
        age: z.coerce.number().min(14, 'Возраст должен быть не менее 14 лет'),
        sex: z.string().min(1, 'Выберите пол'),
        langRu: z.boolean().default(false),
        langEn: z.boolean().default(false),
        rating: z.enum(['yes', 'no']),
        comm: z.string().optional(),
        agreement: z.boolean().refine((val) =>  val, {
            message: 'Необходимо подтвердить согласие',
        }),
    })
    .refine((data) => data.langRu || data.langEn, {
        message: 'Выберите хотя бы один язык',
        path: ['languages_error'],
    });

type FormValues = z.infer<typeof formSchema>;

export default function Onboarding() {
    const location = useLocation();
    const navigate = useNavigate();
    const token = location.state?.token;
    const code = location.state?.code;

    const [registerMutation, { isLoading, error }] = useRegisterMutation();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: '',
            username: '',
            password: '',
            age: '' as unknown as number,
            sex: '',
            langRu: false,
            langEn: false,
            rating: 'no',
            comm: '',
            agreement: false,
        },
    });

    if (!token) {
        // return <Navigate to="/auth/telegram" replace />;
    }

    const onSubmit = async (data: FormValues) => {
        let language = '';
        if (data.langRu && data.langEn) {
            language = 'all';
        } else if (data.langRu) {
            language = 'rus';
        } else if (data.langEn) {
            language = 'eng';
        }

        try {
            await registerMutation({
                token: token || '',
                code: code || '',
                name: data.name,
                username: data.username,
                password: data.password,
                age: data.age,
                rating: data.rating === 'yes',
                sex: data.sex as 'M' | 'F' | 'N',
                lng: language as 'rus' | 'eng' | 'all',
                comm: data.comm,
            }).unwrap();
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    return (
        <main className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
            <div className="w-full max-w-4xl space-y-8">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <CardHeader className="space-y-4">
                            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                                Анкета участника
                            </CardTitle>
                            <div className="space-y-4 leading-relaxed text-slate-900">
                                <p>
                                    Благодарим вас за регистрацию в системе. Перед началом работы
                                    нам необходимо уточнить несколько организационных вопросов для
                                    оптимизации вашего взаимодействия с проектом.
                                </p>
                                <div className="rounded-lg border-l-4 border-slate-400 bg-slate-100 p-4 text-sm">
                                    Напоминаем, что регистрироваться и участвовать в нашем проекте
                                    могут <strong>совершеннолетние лица</strong>. Несовершеннолетние
                                    в возрасте от 14 до 18 лет также могут принимать участие, однако
                                    регистрация должна осуществляться
                                    <strong> с согласия и в присутствии родителей</strong> или
                                    законных представителей.
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 md:p-8">
                            {error && (
                                <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                                    {/* @ts-ignore */}
                                    {error.data?.message ||
                                        // @ts-ignore
                                        error.data?.detail ||
                                        'Ошибка регистрации. Пожалуйста, попробуйте еще раз.'}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                                {/* Левая колонка */}
                                <div className="space-y-8">
                                    {/* Учетная запись */}
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <KeyRound className="size-5" />
                                            <h3>Учетная запись</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Имя (для отображения)</Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <User className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="name"
                                                        className="pl-9"
                                                        placeholder="Ваше имя"
                                                        {...register('name')}
                                                    />
                                                </div>
                                                {errors.name && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.name.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="username">Логин</Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <User className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="username"
                                                        className="pl-9"
                                                        placeholder="Уникальный логин"
                                                        {...register('username')}
                                                    />
                                                </div>
                                                {errors.username && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.username.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Пароль</Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <KeyRound className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        className="pl-9"
                                                        placeholder="Надежный пароль"
                                                        {...register('password')}
                                                    />
                                                </div>
                                                {errors.password && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.password.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Личные данные */}
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <UserCheck className="size-5" />
                                            <h3>Личные данные</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">Ваш возраст</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder="Например, 25"
                                                    min="14"
                                                    {...register('age')}
                                                />
                                                {errors.age && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.age.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Пол</Label>
                                                <Controller
                                                    control={control}
                                                    name="sex"
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <SelectTrigger id="gender">
                                                                <SelectValue placeholder="Не выбрано" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="M">
                                                                    Мужской
                                                                </SelectItem>
                                                                <SelectItem value="F">
                                                                    Женский
                                                                </SelectItem>
                                                                <SelectItem value="N">
                                                                    Предпочитаю не указывать
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                {errors.sex && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.sex.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Языки */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <Languages className="size-5" />
                                            <h3>Языковые компетенции</h3>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            На каких языках вы готовы обрабатывать научные
                                            публикации? (можно выбрать несколько)
                                        </p>
                                        <div className="flex flex-wrap gap-6 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <Controller
                                                    control={control}
                                                    name="langRu"
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            id="lang-ru"
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    )}
                                                />
                                                <Label
                                                    htmlFor="lang-ru"
                                                    className="cursor-pointer font-medium"
                                                >
                                                    Русский
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Controller
                                                    control={control}
                                                    name="langEn"
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            id="lang-en"
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    )}
                                                />
                                                <Label
                                                    htmlFor="lang-en"
                                                    className="cursor-pointer font-medium"
                                                >
                                                    Английский
                                                </Label>
                                            </div>
                                        </div>
                                        {(errors as any).languages_error && (
                                            <span className="block text-xs text-red-500">
                                                {(errors as any).languages_error.message}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Правая колонка */}
                                <div className="flex flex-col space-y-8">
                                    {/* Предпочтения */}
                                    <div className="flex flex-col space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <Settings2 className="size-5" />
                                            <h3>Профессиональные предпочтения</h3>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Укажите пожелания по сложности материала,
                                            географическому региону, автору или конкретному
                                            семейству. Мы постараемся учесть это при распределении
                                            задач.
                                        </p>
                                        <div className="flex grow flex-col pt-2">
                                            <Label
                                                htmlFor="preferences"
                                                className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase"
                                            >
                                                Дополнительная информация (по желанию)
                                            </Label>
                                            <Textarea
                                                id="preferences"
                                                placeholder="Например: предпочтительно семейство Lycosidae, публикации на английском языке, Южный Урал..."
                                                className="min-h-[160px] grow resize-y"
                                                {...register('comm')}
                                            />
                                        </div>
                                    </div>

                                    {/* Публичный рейтинг */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <FileText className="size-5" />
                                            <h3>Публичность данных</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm text-slate-600">
                                                Согласны ли вы на отображение вашего имени в
                                                публичной таблице рейтинга?
                                            </Label>
                                            <Controller
                                                control={control}
                                                name="rating"
                                                render={({ field }) => (
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        className="flex flex-col space-y-2 pt-1"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value="yes"
                                                                id="rating-yes"
                                                            />
                                                            <Label
                                                                htmlFor="rating-yes"
                                                                className="cursor-pointer font-normal"
                                                            >
                                                                Да, я согласен на публичное
                                                                отображение
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem
                                                                value="no"
                                                                id="rating-no"
                                                            />
                                                            <Label
                                                                htmlFor="rating-no"
                                                                className="cursor-pointer font-normal"
                                                            >
                                                                Нет, использовать анонимный
                                                                идентификатор
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                )}
                                            />
                                            {errors.rating && (
                                                <span className="text-xs text-red-500">
                                                    {errors.rating.message}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Соглашение */}
                            <div className="mt-10 border-t border-slate-100 pt-8">
                                <div className="flex items-start space-x-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                                    <Controller
                                        control={control}
                                        name="agreement"
                                        render={({ field }) => (
                                            <Checkbox
                                                id="agreement"
                                                className="mt-1"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label
                                            htmlFor="agreement"
                                            className="cursor-pointer text-sm/snug font-semibold"
                                        >
                                            Я подтверждаю, что соблюдаю условия пользовательского
                                            соглашения и соответствую возрастным критериям проекта
                                        </Label>
                                        {errors.agreement && (
                                            <span className="text-xs text-red-500">
                                                {errors.agreement.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:justify-end">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 px-10 font-bold text-white shadow-md hover:bg-slate-800 sm:w-auto"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Отправка...
                                    </>
                                ) : (
                                    'Завершить регистрацию'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </main>
    );
}
