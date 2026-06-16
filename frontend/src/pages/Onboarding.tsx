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
import { useTranslation } from 'react-i18next';

function useOnboardingSchema(t: (key: string) => string) {
    return z
        .object({
            name: z
                .string()
                .min(3, t('onboarding.validation.nameMin'))
                .max(40, t('onboarding.validation.nameMax'))
                .regex(/^[а-яА-ЯёЁa-zA-Z0-9\s\-'.]+$/, t('onboarding.validation.namePattern')),
            username: z
                .string()
                .min(3, t('onboarding.validation.usernameMin'))
                .max(40, t('onboarding.validation.usernameMax'))
                .regex(/^[a-zA-Z0-9_]+$/, t('onboarding.validation.usernamePattern')),
            password: z
                .string()
                .min(8, t('onboarding.validation.passwordMin'))
                .max(128, t('onboarding.validation.passwordMax')),
            age: z.coerce
                .number()
                .min(14, t('onboarding.validation.ageMin'))
                .max(99, t('onboarding.validation.ageMax')),
            sex: z.enum(['M', 'F', 'N'], { message: t('onboarding.validation.sexRequired') }),
            langRu: z.boolean().default(false),
            langEn: z.boolean().default(false),
            rating: z.enum(['yes', 'no']),
            comm: z.string().optional(),
            agreement: z.boolean().refine((val) => val, {
                message: t('onboarding.validation.agreementRequired'),
            }),
        })
        .refine((data) => data.langRu || data.langEn, {
            message: t('onboarding.validation.languagesRequired'),
            path: ['languages_error'],
        });
}

type FormValues = {
    name: string;
    username: string;
    password: string;
    age: number;
    sex: 'M' | 'F' | 'N';
    langRu: boolean;
    langEn: boolean;
    rating: 'yes' | 'no';
    comm?: string;
    agreement: boolean;
};

export default function Onboarding() {
    const { t } = useTranslation();
    const formSchema = useOnboardingSchema(t);
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { token?: string; code?: string } | null;
    const token = state?.token;
    const code = state?.code;

    const [registerMutation, { isLoading, error }] = useRegisterMutation();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(
            formSchema,
        ) as unknown as import('react-hook-form').Resolver<FormValues>,
        defaultValues: {
            name: '',
            username: '',
            password: '',
            age: '' as never,
            sex: undefined as never,
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
        let language: 'rus' | 'eng' | 'all' = 'rus';
        if (data.langRu && data.langEn) {
            language = 'all';
        } else if (data.langRu) {
            language = 'rus';
        } else if (data.langEn) {
            language = 'eng';
        }

        try {
            await registerMutation({
                token: token ?? '',
                code: code ?? '',
                name: data.name,
                username: data.username,
                password: data.password,
                age: data.age,
                rating: data.rating === 'yes',
                sex: data.sex,
                lng: language,
                comm: data.comm,
            }).unwrap();
            void navigate('/dashboard', { replace: true });
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
                                {t('onboarding.profileTitle')}
                            </CardTitle>
                            <div className="space-y-4 leading-relaxed text-slate-900">
                                <p>{t('onboarding.profileThanks')}</p>
                                <div className="rounded-lg border-l-4 border-slate-400 bg-slate-100 p-4 text-sm">
                                    {t('onboarding.ageNotice')}
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
                                        t('onboarding.registrationError')}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                                {/* Левая колонка */}
                                <div className="space-y-8">
                                    {/* Учетная запись */}
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <KeyRound className="size-5" />
                                            <h3>{t('onboarding.accountTitle')}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                                        placeholder={t(
                                                            'onboarding.namePlaceholder',
                                                        )}
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
                                                <Label htmlFor="username">
                                                    {t('settings.account.username')}
                                                </Label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <User className="size-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        id="username"
                                                        className="pl-9"
                                                        placeholder={t(
                                                            'onboarding.usernamePlaceholder',
                                                        )}
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
                                                            'onboarding.passwordPlaceholder',
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
                                            <h3>{t('onboarding.personalDataTitle')}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">
                                                    {t('onboarding.yourAge')}
                                                </Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder={t('onboarding.agePlaceholder')}
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
                                                <Label htmlFor="gender">
                                                    {t('onboarding.gender')}
                                                </Label>
                                                <Controller
                                                    control={control}
                                                    name="sex"
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <SelectTrigger id="gender">
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        'onboarding.notSelected',
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="M">
                                                                    {t('onboarding.male')}
                                                                </SelectItem>
                                                                <SelectItem value="F">
                                                                    {t('onboarding.female')}
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

                                    {/* Языки */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <Languages className="size-5" />
                                            <h3>{t('onboarding.languageCompetencies')}</h3>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            {t('onboarding.languageDesc')}
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
                                                    {t('onboarding.russian')}
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
                                                    {t('onboarding.english')}
                                                </Label>
                                            </div>
                                        </div>
                                        {(errors as Record<string, { message?: string }>)
                                            .languages_error && (
                                            <span className="block text-xs text-red-500">
                                                {
                                                    (errors as Record<string, { message?: string }>)
                                                        .languages_error?.message
                                                }
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
                                            <h3>{t('onboarding.professionalPreferences')}</h3>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            {t('onboarding.preferencesDesc')}
                                        </p>
                                        <div className="flex grow flex-col pt-2">
                                            <Label
                                                htmlFor="preferences"
                                                className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase"
                                            >
                                                {t('onboarding.additionalInfo')}
                                            </Label>
                                            <Textarea
                                                id="preferences"
                                                placeholder={t('onboarding.preferencesPlaceholder')}
                                                className="min-h-[160px] grow resize-y"
                                                {...register('comm')}
                                            />
                                        </div>
                                    </div>

                                    {/* Публичный рейтинг */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                            <FileText className="size-5" />
                                            <h3>{t('onboarding.dataPublicity')}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm text-slate-600">
                                                {t('onboarding.publicityQuestion')}
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
                                                                {t('onboarding.publicityYes')}
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
                                                                {t('onboarding.publicityNo')}
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
                                            {t('onboarding.agreement')}
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
                                        {t('onboarding.sending')}
                                    </>
                                ) : (
                                    t('onboarding.completeRegistration')
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </main>
    );
}
