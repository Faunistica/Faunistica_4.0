import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
    Loader2,
    User,
    UserCheck,
    Languages,
    FileText,
    MapPin,
    Mail,
    KeyRound,
    Settings2,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
    CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useGetMeQuery, useUpdateMeMutation } from '@/api/userAPI';
import { toast } from 'sonner';

const getFormSchema = (t: (key: string) => string) =>
    z
        .object({
            username: z
                .string()
                .min(3, t('settings.validation.usernameMin'))
                .max(40, t('settings.validation.usernameMax'))
                .regex(/^[a-zA-Z0-9_]+$/, t('settings.validation.usernamePattern'))
                .optional()
                .or(z.literal('')),
            password: z
                .string()
                .min(8, t('settings.validation.passwordMin'))
                .max(128, t('settings.validation.passwordMax'))
                .optional()
                .or(z.literal('')),
            name: z
                .string()
                .min(3, t('settings.validation.nameMin'))
                .max(40, t('settings.validation.nameMax'))
                .regex(/^[а-яА-ЯёЁa-zA-Z0-9\s\-'.]+$/, t('settings.validation.namePattern')),
            age: z.coerce
                .number()
                .min(14, t('settings.validation.ageMin'))
                .max(99, t('settings.validation.ageMax'))
                .nullable()
                .optional(),
            sex: z.enum(['M', 'F', 'N']).nullable().optional(),
            langRu: z.boolean().default(false),
            langEn: z.boolean().default(false),
            rating: z.enum(['yes', 'no']),
            email: z
                .string()
                .min(5, t('settings.validation.emailMin'))
                .max(100, t('settings.validation.emailMax'))
                .email(t('settings.validation.emailInvalid'))
                .or(z.literal(''))
                .nullable()
                .optional(),
            region: z.string().nullable().optional(),
            comm: z.string().nullable().optional(),
        })
        .refine((data) => data.langRu || data.langEn, {
            message: t('settings.languages.atLeastOne'),
            path: ['languages_error'],
        });

const _defaultSchema = getFormSchema((k: string) => k);
type FormValues = z.infer<typeof _defaultSchema>;

export default function Settings() {
    const { t } = useTranslation();
    const { data: user, isLoading: isUserLoading } = useGetMeQuery();
    const [updateMe, { isLoading: isUpdating, isSuccess }] = useUpdateMeMutation();

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<FormValues>({
        resolver: zodResolver(
            getFormSchema(t),
        ) as unknown as import('react-hook-form').Resolver<FormValues>,
        defaultValues: {
            username: '',
            password: '',
            name: '',
            age: null,
            sex: undefined,
            langRu: false,
            langEn: false,
            rating: 'no',
            email: '',
            region: '',
            comm: '',
        },
    });

    useEffect(() => {
        if (user) {
            const sexValue = user.sex?.trim().toUpperCase();
            reset({
                username: user.username || '',
                password: '',
                name: user.name || '',
                age: user.age ?? null,
                sex:
                    sexValue === 'M' || sexValue === 'F' || sexValue === 'N' ? sexValue : undefined,
                langRu: user.lng === 'rus' || user.lng === 'all',
                langEn: user.lng === 'eng' || user.lng === 'all',
                rating: user.rating === 1 ? 'yes' : 'no',
                email: user.email || '',
                region: user.region || '',
                comm: user.comm || '',
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: FormValues) => {
        let language: 'rus' | 'eng' | 'all' | null = null;
        if (data.langRu && data.langEn) {
            language = 'all';
        } else if (data.langRu) {
            language = 'rus';
        } else if (data.langEn) {
            language = 'eng';
        }

        try {
            await updateMe({
                username: user?.username ? null : data.username || null,
                password: data.password || null,
                name: data.name,
                age: data.age ?? null,
                sex: data.sex ? data.sex.toUpperCase() : null,
                lng: language,
                rating: data.rating === 'yes' ? 1 : 0,
                email: data.email || null,
                region: data.region || null,
                comm: data.comm || null,
            }).unwrap();
            reset({
                username: data.username,
                password: '',
                name: data.name,
                age: data.age,
                sex: data.sex,
                langRu: data.langRu,
                langEn: data.langEn,
                rating: data.rating,
                email: data.email,
                region: data.region,
                comm: data.comm,
            });
        } catch (err) {
            toast.error(t('settings.error'));
            console.error('Update failed:', err);
        }
    };

    if (isUserLoading) {
        return (
            <div className="flex h-full min-h-[50vh] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <main className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
            <div className="w-full max-w-4xl space-y-8">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <CardHeader className="space-y-4">
                            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                                {t('settings.title')}
                            </CardTitle>
                            <CardDescription>{t('settings.description')}</CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 md:p-8">
                            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                                {/* Левая колонка */}
                                <div className="space-y-8">
                                    {/* Учетная запись */}
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <KeyRound className="size-5" />
                                            <h3>{t('settings.account.title')}</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="username">
                                                    {t('settings.account.username')}
                                                </Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <User className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="username"
                                                        disabled={!!user?.username}
                                                        className={`pl-9 ${user?.username ? 'bg-slate-50 text-slate-500' : ''}`}
                                                        placeholder={t('settings.account.username')}
                                                        {...register('username')}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {user?.username
                                                        ? t('settings.account.usernameHint')
                                                        : t('settings.account.usernameHintNew')}
                                                </p>
                                                {errors.username && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.username.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="name">
                                                    {t('settings.account.name')}
                                                </Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <User className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="name"
                                                        className="pl-9"
                                                        placeholder={t('settings.account.name')}
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
                                                <Label htmlFor="password">
                                                    {t('settings.account.password')}
                                                </Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <KeyRound className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        className="pl-9"
                                                        placeholder={t(
                                                            'settings.account.passwordHint',
                                                        )}
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
                                            <h3>{t('settings.personal.title')}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">
                                                    {t('settings.personal.age')}
                                                </Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder={t('settings.personal.age')}
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
                                                <Label htmlFor="sex">
                                                    {t('settings.personal.sex')}
                                                </Label>
                                                <Controller
                                                    control={control}
                                                    name="sex"
                                                    render={({ field }) => (
                                                        <Select
                                                            key={`sex-${field.value}`}
                                                            onValueChange={field.onChange}
                                                            value={field.value || undefined}
                                                        >
                                                            <SelectTrigger id="sex">
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        'settings.personal.sex',
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="M">
                                                                    {t('settings.personal.male')}
                                                                </SelectItem>
                                                                <SelectItem value="F">
                                                                    {t('settings.personal.female')}
                                                                </SelectItem>
                                                                <SelectItem value="N">
                                                                    {t(
                                                                        'settings.personal.preferNotToSay',
                                                                    )}
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

                                    {/* Контакты и регион */}
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <Mail className="size-5" />
                                            <h3>{t('settings.contacts.title')}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    {t('settings.contacts.email')}
                                                </Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <Mail className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        className="pl-9"
                                                        placeholder="email@example.com"
                                                        {...register('email')}
                                                    />
                                                </div>
                                                {errors.email && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.email.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="region">
                                                    {t('settings.contacts.region')}
                                                </Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <MapPin className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="region"
                                                        className="pl-9"
                                                        placeholder={t('settings.contacts.region')}
                                                        {...register('region')}
                                                    />
                                                </div>
                                                {errors.region && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.region.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Правая колонка */}
                                <div className="flex flex-col space-y-8">
                                    {/* Языки */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <Languages className="size-5" />
                                            <h3>{t('settings.languages.title')}</h3>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            {t('settings.languages.description')}
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
                                                    {t('settings.languages.russian')}
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
                                                    {t('settings.languages.english')}
                                                </Label>
                                            </div>
                                        </div>
                                        {(errors as Record<string, { message?: string }>)
                                            .languages_error && (
                                            <span className="block pt-1 text-xs text-red-500">
                                                {
                                                    (errors as Record<string, { message?: string }>)
                                                        .languages_error?.message
                                                }
                                            </span>
                                        )}
                                    </div>

                                    {/* Предпочтения */}
                                    <div className="flex flex-col space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <Settings2 className="size-5" />
                                            <h3>{t('settings.preferences.title')}</h3>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            {t('settings.preferences.description')}
                                        </p>
                                        <div className="flex grow flex-col pt-2">
                                            <Label
                                                htmlFor="preferences"
                                                className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase"
                                            >
                                                {t('settings.preferences.title')}
                                            </Label>
                                            <Textarea
                                                id="preferences"
                                                placeholder={t('settings.preferences.placeholder')}
                                                className="min-h-[160px] grow resize-y"
                                                {...register('comm')}
                                            />
                                        </div>
                                    </div>

                                    {/* Публичный рейтинг */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <FileText className="size-5" />
                                            <h3>{t('settings.rating.title')}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm text-slate-600">
                                                {t('settings.rating.description')}
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
                                                                {t('settings.rating.yes')}
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
                                                                {t('settings.rating.no')}
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
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                            {isSuccess && !isDirty ? (
                                <span className="text-sm font-medium text-green-600">
                                    {t('settings.success')}
                                </span>
                            ) : (
                                <span />
                            )}
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full bg-slate-900 px-10 font-bold text-white shadow-md hover:bg-slate-800 sm:w-auto"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        {t('common.saving')}
                                    </>
                                ) : (
                                    t('common.save')
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </main>
    );
}
