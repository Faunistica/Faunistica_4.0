import { type FC, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import {
    useGetPublicationByIdQuery,
    useGetSubmitStatusQuery,
    useSubmitPublicationMutation,
} from '@/api/publAPI';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    ArrowLeft,
    AlertCircle,
    Loader2,
    CheckCircle2,
    FileText,
    MapPin,
    Hash,
    MessageSquare,
    ChevronDown,
    Square,
    Flower2,
    Layers,
    MoveDiagonal,
    Eye,
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

/* ─── Schema ─── */

const submitFormSchema = z.object({
    processingLevel: z.enum(['full', 'ural', 'part', 'skip'], {
        message: 'Выберите уровень обработки',
    }),
    uralsScope: z.enum(['yes', 'no']).nullable(),
    materialStatus: z.enum(['yes', 'no']).nullable(),
    comment: z.string().max(1000, 'Комментарий не длиннее 1000 символов').optional(),
});

type SubmitForm = z.infer<typeof submitFormSchema>;

const LEVEL_LABELS: Record<string, string> = {
    full: 'Полная',
    ural: 'Урал',
    part: 'Частичная',
    skip: 'Пропуск',
};

const LEVEL_DESC: Record<string, string> = {
    full: 'Все виды определены до вида',
    ural: 'Обработка ограничена Уралом',
    part: 'Часть видов не определена',
    skip: 'Публикация пропущена',
};

type ThemeId = 'constructivist' | 'herbarium' | 'minimalist';

interface ThemeMeta {
    id: ThemeId;
    label: string;
    icon: typeof Square;
}

const THEMES: ThemeMeta[] = [
    { id: 'constructivist', label: 'Конструктивизм', icon: MoveDiagonal },
    { id: 'herbarium', label: 'Гербарий', icon: Flower2 },
    { id: 'minimalist', label: 'Минимализм', icon: Layers },
];

const LS_KEY = 'faunistica-submit-theme';

/* ─── Theme Switcher ─── */

const ThemeSwitcher: FC<{
    current: ThemeId;
    onChange: (t: ThemeId) => void;
}> = ({ current, onChange }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium tracking-wider uppercase transition-colors"
                style={{
                    color: 'var(--theme-text-muted)',
                    border: '1px solid var(--theme-divider)',
                }}
            >
                <Eye className="size-3" />
                {THEMES.find((t) => t.id === current)?.label}
                <ChevronDown className="size-3" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full right-0 z-50 mt-1 min-w-40 overflow-hidden rounded-md border bg-white shadow-lg"
                        style={{ borderColor: 'var(--theme-divider)' }}
                    >
                        {THEMES.map((t) => {
                            const Icon = t.icon;
                            const active = t.id === current;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        onChange(t.id);
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium tracking-wider uppercase transition-colors hover:bg-slate-100"
                                    style={{
                                        color: active ? 'var(--theme-accent)' : 'var(--theme-text)',
                                        backgroundColor: active
                                            ? 'oklch(0.95 0.01 260)'
                                            : 'transparent',
                                    }}
                                >
                                    <Icon className="size-3" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Helpers ─── */

const stagger = (i: number) => ({ delay: 0.06 * i });

const containerAnim = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const itemAnim = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
};

/* ─── Main ─── */

const SubmitPublication: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const publ_id = Number(id);

    const { data: pub, isLoading: pubLoading } = useGetPublicationByIdQuery(publ_id);
    const { data: status, isLoading: statusLoading } = useGetSubmitStatusQuery(publ_id);
    const [submit, { isLoading: submitting }] = useSubmitPublicationMutation();

    const [theme, setTheme] = useState<ThemeId>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem(LS_KEY) as ThemeId) || 'constructivist';
        }
        return 'constructivist';
    });

    useEffect(() => {
        localStorage.setItem(LS_KEY, theme);
    }, [theme]);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        watch,
    } = useForm<SubmitForm>({
        resolver: zodResolver(submitFormSchema),
        defaultValues: {
            processingLevel: undefined,
            uralsScope: null,
            materialStatus: null,
            comment: '',
        },
        mode: 'onChange',
    });

    const processingLevel = watch('processingLevel');

    const onSubmit = useCallback(
        async (data: SubmitForm) => {
            const result = await submit({
                publ_id,
                data: {
                    processing_level: data.processingLevel,
                    urals_scope: data.uralsScope || null,
                    material_status: data.materialStatus || null,
                    comment: data.comment || null,
                },
            });
            if (!result.error) {
                toast.success('Публикация отмечена как обработанная');
                navigate('/dashboard', { replace: true });
            }
        },
        [publ_id, submit, navigate],
    );

    if (pubLoading || statusLoading) return <LoadingScreen />;

    const draftIds = status?.draft_record_ids ?? [];
    const hasDrafts = draftIds.length > 0;

    const meta = pub
        ? [pub.author, pub.year?.toString(), pub.name].filter(Boolean).join(' — ')
        : '';

    return (
        <div
            data-theme={theme}
            className="min-h-screen py-8 transition-colors duration-500"
            style={{ backgroundColor: 'var(--theme-bg)' }}
        >
            <div className="mx-auto max-w-3xl px-4" style={{ color: 'var(--theme-text)' }}>
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={containerAnim}
                    transition={{ duration: 0.4 }}
                >
                    {/* Theme switcher + breadcrumb row */}
                    <div className="mb-4 flex items-center justify-between">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1 text-sm transition-colors hover:opacity-70"
                            style={{ color: 'var(--theme-text-muted)' }}
                        >
                            <ArrowLeft className="size-4" />
                            На дашборд
                        </Link>
                        <ThemeSwitcher current={theme} onChange={setTheme} />
                    </div>

                    <AnimatePresence mode="wait">
                        {theme === 'constructivist' && (
                            <Constructivist
                                key="constructivist"
                                publ_id={publ_id}
                                meta={meta}
                                hasDrafts={hasDrafts}
                                draftIds={draftIds}
                                control={control}
                                errors={errors}
                                isValid={isValid}
                                submitting={submitting}
                                processingLevel={processingLevel}
                                handleSubmit={handleSubmit}
                                onSubmit={onSubmit}
                            />
                        )}
                        {theme === 'herbarium' && (
                            <Herbarium
                                key="herbarium"
                                publ_id={publ_id}
                                meta={meta}
                                hasDrafts={hasDrafts}
                                draftIds={draftIds}
                                control={control}
                                errors={errors}
                                isValid={isValid}
                                submitting={submitting}
                                processingLevel={processingLevel}
                                handleSubmit={handleSubmit}
                                onSubmit={onSubmit}
                            />
                        )}
                        {theme === 'minimalist' && (
                            <Minimalist
                                key="minimalist"
                                publ_id={publ_id}
                                meta={meta}
                                hasDrafts={hasDrafts}
                                draftIds={draftIds}
                                control={control}
                                errors={errors}
                                isValid={isValid}
                                submitting={submitting}
                                processingLevel={processingLevel}
                                handleSubmit={handleSubmit}
                                onSubmit={onSubmit}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default SubmitPublication;

/* ═══════════════════════════════════════════
   THEME: КОНСТРУКТИВИЗМ
   ═══════════════════════════════════════════ */

const Constructivist: FC<FormLayoutProps> = (p) => {
    if (p.hasDrafts) return <DraftsBlock {...p} />;

    return (
        <motion.div variants={containerAnim} initial="initial" animate="animate">
            <div className="relative overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.9)]">
                {/* Red accent bar */}
                <div
                    className="absolute top-0 -right-12 h-2 w-48 origin-top-right rotate-45"
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                />

                <div className="p-4 sm:p-8">
                    <motion.div variants={itemAnim} transition={stagger(0)} className="mb-6">
                        <h1
                            className="text-4xl leading-none font-black tracking-tighter sm:text-5xl"
                            style={{ color: 'var(--theme-accent)' }}
                        >
                            ЗАВЕРШЕНИЕ
                            <br />
                            РАБОТЫ
                        </h1>
                        <div
                            className="mt-1 h-1 w-24"
                            style={{ backgroundColor: 'var(--theme-accent)' }}
                        />
                        <p
                            className="mt-3 text-xs font-semibold tracking-widest uppercase"
                            style={{ color: 'var(--theme-text-muted)' }}
                        >
                            Публикация #{p.publ_id}
                        </p>
                        {p.meta && (
                            <p
                                className="mt-1 text-sm"
                                style={{ color: 'var(--theme-text-muted)' }}
                            >
                                {p.meta}
                            </p>
                        )}
                    </motion.div>

                    <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-5">
                        {/* Select — spans 3 cols */}
                        <motion.div
                            variants={itemAnim}
                            transition={stagger(1)}
                            className="sm:col-span-3"
                        >
                            <FieldLabelConstructivist icon={FileText} text="Уровень обработки" />
                            <Controller
                                name="processingLevel"
                                control={p.control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full rounded-none border-2 border-black text-sm font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)]">
                                            <SelectValue placeholder="ВЫБЕРИТЕ УРОВЕНЬ" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none border-2 border-black">
                                            {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                                                <SelectItem
                                                    key={val}
                                                    value={val}
                                                    className="font-medium"
                                                >
                                                    <span className="font-bold">{label}</span>
                                                    <span className="ml-2 text-xs opacity-60">
                                                        {LEVEL_DESC[val]}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {p.errors.processingLevel && (
                                <p className="mt-1 text-xs font-bold text-red-600">
                                    {p.errors.processingLevel.message}
                                </p>
                            )}
                        </motion.div>

                        {/* empty 2 cols */}
                        <div className="hidden sm:col-span-2 sm:block" />

                        {/* Radio 1 — col 1-2 */}
                        <motion.div
                            variants={itemAnim}
                            transition={stagger(2)}
                            className="sm:col-span-2"
                        >
                            <FieldLabelConstructivist icon={MapPin} text="Находки за Уралом?" />
                            <Controller
                                name="uralsScope"
                                control={p.control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ?? ''}
                                        onValueChange={(v) => field.onChange(v || null)}
                                        className="flex gap-0 border-2 border-black"
                                    >
                                        {[
                                            { val: 'yes', label: 'ДА' },
                                            { val: 'no', label: 'НЕТ' },
                                        ].map((opt) => (
                                            <Label
                                                key={opt.val}
                                                htmlFor={`con-u-${opt.val}`}
                                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-r-2 border-black py-3 text-xs font-bold uppercase last:border-r-0 has-data-checked:bg-black has-data-checked:text-white"
                                            >
                                                <RadioGroupItem
                                                    value={opt.val}
                                                    id={`con-u-${opt.val}`}
                                                    className="sr-only"
                                                />
                                                {opt.label}
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                        </motion.div>

                        {/* Radio 2 — col 4-5 */}
                        <motion.div
                            variants={itemAnim}
                            transition={stagger(3)}
                            className="sm:col-span-2 sm:col-start-4"
                        >
                            <FieldLabelConstructivist icon={Hash} text="Виды без материала?" />
                            <Controller
                                name="materialStatus"
                                control={p.control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ?? ''}
                                        onValueChange={(v) => field.onChange(v || null)}
                                        className="flex gap-0 border-2 border-black"
                                    >
                                        {[
                                            { val: 'yes', label: 'ДА' },
                                            { val: 'no', label: 'НЕТ' },
                                        ].map((opt) => (
                                            <Label
                                                key={opt.val}
                                                htmlFor={`con-m-${opt.val}`}
                                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-r-2 border-black py-3 text-xs font-bold uppercase last:border-r-0 has-data-checked:bg-black has-data-checked:text-white"
                                            >
                                                <RadioGroupItem
                                                    value={opt.val}
                                                    id={`con-m-${opt.val}`}
                                                    className="sr-only"
                                                />
                                                {opt.label}
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                        </motion.div>

                        {/* Textarea — full width */}
                        <motion.div
                            variants={itemAnim}
                            transition={stagger(4)}
                            className="sm:col-span-5"
                        >
                            <FieldLabelConstructivist icon={MessageSquare} text="Комментарий" />
                            <Controller
                                name="comment"
                                control={p.control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="ЗАМЕЧАНИЯ ПО ПУБЛИКАЦИИ (ОПЦИОНАЛЬНО)"
                                        className="min-h-24 rounded-none border-2 border-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.9)] placeholder:text-xs placeholder:font-bold placeholder:tracking-wider placeholder:text-gray-400"
                                    />
                                )}
                            />
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <motion.div
                        variants={itemAnim}
                        transition={stagger(5)}
                        className="mt-8 flex items-center justify-between border-t-2 border-black pt-6"
                    >
                        <Button
                            variant="outline"
                            asChild
                            className="rounded-none border-2 border-black text-xs font-bold tracking-wider uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-none"
                        >
                            <Link to="/dashboard">Отмена</Link>
                        </Button>
                        <Button
                            onClick={p.handleSubmit(p.onSubmit)}
                            disabled={!p.isValid || p.submitting}
                            className="rounded-none border-2 border-black bg-black px-6 text-xs font-bold tracking-wider text-white uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 disabled:opacity-40"
                            style={{
                                backgroundColor: 'var(--theme-accent)',
                                borderColor: 'var(--theme-accent)',
                            }}
                        >
                            {p.submitting ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 size-4" />
                            )}
                            {p.submitting ? 'ОТПРАВКА...' : 'ЗАВЕРШИТЬ'}
                        </Button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════
   THEME: ГЕРБАРИЙ
   ═══════════════════════════════════════════ */

const Herbarium: FC<FormLayoutProps> = (p) => {
    if (p.hasDrafts) return <DraftsBlock {...p} />;

    return (
        <motion.div variants={containerAnim} initial="initial" animate="animate">
            <div
                className="relative border-2 p-1"
                style={{ borderColor: 'var(--theme-card-border)' }}
            >
                <div
                    className="border p-5 sm:p-8"
                    style={{ borderColor: 'var(--theme-card-border)' }}
                >
                    {/* Corner ornaments */}
                    <CornerOrnament position="top-left" />
                    <CornerOrnament position="top-right" />
                    <CornerOrnament position="bottom-left" />
                    <CornerOrnament position="bottom-right" />

                    {/* Header */}
                    <motion.div
                        variants={itemAnim}
                        transition={stagger(0)}
                        className="mb-8 text-center"
                    >
                        <div className="mb-2 flex items-center justify-center gap-3">
                            <div
                                className="h-px w-12"
                                style={{ backgroundColor: 'var(--theme-divider)' }}
                            />
                            <Flower2 className="size-4" style={{ color: 'var(--theme-accent)' }} />
                            <div
                                className="h-px w-12"
                                style={{ backgroundColor: 'var(--theme-divider)' }}
                            />
                        </div>
                        <h1
                            className="text-3xl font-light tracking-wide italic sm:text-4xl"
                            style={{ color: 'var(--theme-text)' }}
                        >
                            Завершение работы
                        </h1>
                        <p
                            className="mt-1 text-xs font-medium tracking-[0.15em] uppercase"
                            style={{ color: 'var(--theme-text-muted)' }}
                        >
                            Публикация #{p.publ_id}
                        </p>
                        {p.meta && (
                            <p
                                className="mt-1 text-sm italic"
                                style={{ color: 'var(--theme-text-muted)' }}
                            >
                                {p.meta}
                            </p>
                        )}
                    </motion.div>

                    <div className="space-y-7">
                        {/* Select */}
                        <motion.div variants={itemAnim} transition={stagger(1)}>
                            <FieldLabelHerbarium icon={FileText} text="Уровень обработки" />
                            <Controller
                                name="processingLevel"
                                control={p.control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger
                                            className="w-full border text-sm transition-colors"
                                            style={{
                                                borderColor: 'var(--theme-divider)',
                                                borderRadius: 0,
                                            }}
                                        >
                                            <SelectValue placeholder="— выберите уровень —" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                                                <SelectItem key={val} value={val}>
                                                    <span>{label}</span>
                                                    <span className="ml-2 text-xs opacity-60">
                                                        {LEVEL_DESC[val]}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {p.errors.processingLevel && (
                                <p className="mt-1 text-xs text-red-600 italic">
                                    {p.errors.processingLevel.message}
                                </p>
                            )}
                        </motion.div>

                        {/* Divider */}
                        <motion.div
                            variants={itemAnim}
                            transition={stagger(1.5)}
                            className="flex items-center gap-3"
                        >
                            <div
                                className="h-px flex-1"
                                style={{ backgroundColor: 'var(--theme-divider)' }}
                            />
                            <span
                                className="text-xs italic"
                                style={{ color: 'var(--theme-text-muted)' }}
                            >
                                sectio
                            </span>
                            <div
                                className="h-px flex-1"
                                style={{ backgroundColor: 'var(--theme-divider)' }}
                            />
                        </motion.div>

                        {/* Radio 1 */}
                        <motion.div variants={itemAnim} transition={stagger(2)}>
                            <FieldLabelHerbarium icon={MapPin} text="Находки за пределами Урала?" />
                            <Controller
                                name="uralsScope"
                                control={p.control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ?? ''}
                                        onValueChange={(v) => field.onChange(v || null)}
                                        className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                                    >
                                        {[
                                            { val: 'yes', label: 'Да' },
                                            { val: 'no', label: 'Нет' },
                                        ].map((opt) => (
                                            <div key={opt.val} className="flex items-center gap-2">
                                                <RadioGroupItem
                                                    value={opt.val}
                                                    id={`her-u-${opt.val}`}
                                                    className="border"
                                                    style={{
                                                        borderColor: 'var(--theme-divider)',
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={`her-u-${opt.val}`}
                                                    className="cursor-pointer text-sm font-normal italic"
                                                >
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                        </motion.div>

                        {/* Radio 2 */}
                        <motion.div variants={itemAnim} transition={stagger(3)}>
                            <FieldLabelHerbarium icon={Hash} text="Указания видов без материала?" />
                            <Controller
                                name="materialStatus"
                                control={p.control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ?? ''}
                                        onValueChange={(v) => field.onChange(v || null)}
                                        className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                                    >
                                        {[
                                            { val: 'yes', label: 'Да' },
                                            { val: 'no', label: 'Нет' },
                                        ].map((opt) => (
                                            <div key={opt.val} className="flex items-center gap-2">
                                                <RadioGroupItem
                                                    value={opt.val}
                                                    id={`her-m-${opt.val}`}
                                                    className="border"
                                                    style={{
                                                        borderColor: 'var(--theme-divider)',
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={`her-m-${opt.val}`}
                                                    className="cursor-pointer text-sm font-normal italic"
                                                >
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                        </motion.div>

                        {/* Textarea */}
                        <motion.div variants={itemAnim} transition={stagger(4)}>
                            <FieldLabelHerbarium icon={MessageSquare} text="Комментарий" />
                            <Controller
                                name="comment"
                                control={p.control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="Любые замечания по публикации..."
                                        className="min-h-24 border text-sm italic placeholder:text-sm placeholder:text-gray-400 placeholder:italic"
                                        style={{
                                            borderColor: 'var(--theme-divider)',
                                            borderRadius: 0,
                                        }}
                                    />
                                )}
                            />
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <motion.div
                        variants={itemAnim}
                        transition={stagger(5)}
                        className="mt-8 flex items-center justify-between border-t pt-6"
                        style={{ borderColor: 'var(--theme-divider)' }}
                    >
                        <Button
                            variant="outline"
                            asChild
                            className="border text-sm italic"
                            style={{
                                borderColor: 'var(--theme-divider)',
                                borderRadius: 0,
                            }}
                        >
                            <Link to="/dashboard">Отмена</Link>
                        </Button>
                        <Button
                            onClick={p.handleSubmit(p.onSubmit)}
                            disabled={!p.isValid || p.submitting}
                            className="text-sm text-white italic"
                            style={{
                                backgroundColor: 'var(--theme-accent)',
                                borderRadius: 0,
                            }}
                        >
                            {p.submitting ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 size-4" />
                            )}
                            {p.submitting ? 'Отправка...' : 'Завершить'}
                        </Button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════
   THEME: МИНИМАЛИЗМ
   ═══════════════════════════════════════════ */

const Minimalist: FC<FormLayoutProps> = (p) => {
    if (p.hasDrafts) return <DraftsBlock {...p} />;

    return (
        <motion.div variants={containerAnim} initial="initial" animate="animate">
            {/* Accent line */}
            <div className="mb-8 h-1 w-16" style={{ backgroundColor: 'var(--theme-accent)' }} />

            <motion.div variants={itemAnim} transition={stagger(0)} className="mb-10">
                <p
                    className="mb-1 text-[10px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: 'var(--theme-text-muted)' }}
                >
                    Публикация #{p.publ_id}
                </p>
                <h1
                    className="text-4xl font-light tracking-tight sm:text-5xl"
                    style={{ color: 'var(--theme-text)' }}
                >
                    Завершение работы
                </h1>
                {p.meta && (
                    <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                        {p.meta}
                    </p>
                )}
            </motion.div>

            <div className="max-w-2xl space-y-10">
                {/* Select */}
                <motion.div variants={itemAnim} transition={stagger(1)}>
                    <MinimalLabel text="Уровень обработки" />
                    <div className="mt-3" style={{ borderTop: '1px solid var(--theme-divider)' }} />
                    <div className="mt-3">
                        <Controller
                            name="processingLevel"
                            control={p.control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger
                                        className="w-full border-0 bg-transparent px-0 text-base font-light tracking-tight shadow-none focus-visible:ring-0"
                                        style={{
                                            color: field.value
                                                ? 'var(--theme-text)'
                                                : 'var(--theme-text-muted)',
                                        }}
                                    >
                                        <SelectValue placeholder="Выберите уровень обработки" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>
                                                <span className="font-medium">{label}</span>
                                                <span className="ml-2 text-xs opacity-50">
                                                    {LEVEL_DESC[val]}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <div
                            className="mt-1"
                            style={{ borderTop: '1px solid var(--theme-divider)' }}
                        />
                        {p.errors.processingLevel && (
                            <p className="mt-1 text-xs text-red-500">
                                {p.errors.processingLevel.message}
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Radio 1 */}
                <motion.div variants={itemAnim} transition={stagger(2)}>
                    <MinimalLabel text="Находки за пределами Урала?" />
                    <div className="mt-3" style={{ borderTop: '1px solid var(--theme-divider)' }} />
                    <div className="mt-3">
                        <Controller
                            name="uralsScope"
                            control={p.control}
                            render={({ field }) => (
                                <RadioGroup
                                    value={field.value ?? ''}
                                    onValueChange={(v) => field.onChange(v || null)}
                                    className="flex gap-8"
                                >
                                    {[
                                        { val: 'yes', label: 'Да' },
                                        { val: 'no', label: 'Нет' },
                                    ].map((opt) => (
                                        <div key={opt.val} className="flex items-center gap-3">
                                            <RadioGroupItem
                                                value={opt.val}
                                                id={`min-u-${opt.val}`}
                                                className="size-4 border-gray-300 data-checked:border-[var(--theme-accent)] data-checked:bg-[var(--theme-accent)]"
                                            />
                                            <Label
                                                htmlFor={`min-u-${opt.val}`}
                                                className="cursor-pointer text-sm font-light tracking-wide"
                                            >
                                                {opt.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        />
                    </div>
                </motion.div>

                {/* Radio 2 */}
                <motion.div variants={itemAnim} transition={stagger(3)}>
                    <MinimalLabel text="Указания видов без материала?" />
                    <div className="mt-3" style={{ borderTop: '1px solid var(--theme-divider)' }} />
                    <div className="mt-3">
                        <Controller
                            name="materialStatus"
                            control={p.control}
                            render={({ field }) => (
                                <RadioGroup
                                    value={field.value ?? ''}
                                    onValueChange={(v) => field.onChange(v || null)}
                                    className="flex gap-8"
                                >
                                    {[
                                        { val: 'yes', label: 'Да' },
                                        { val: 'no', label: 'Нет' },
                                    ].map((opt) => (
                                        <div key={opt.val} className="flex items-center gap-3">
                                            <RadioGroupItem
                                                value={opt.val}
                                                id={`min-m-${opt.val}`}
                                                className="size-4 border-gray-300 data-checked:border-[var(--theme-accent)] data-checked:bg-[var(--theme-accent)]"
                                            />
                                            <Label
                                                htmlFor={`min-m-${opt.val}`}
                                                className="cursor-pointer text-sm font-light tracking-wide"
                                            >
                                                {opt.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        />
                    </div>
                </motion.div>

                {/* Textarea */}
                <motion.div variants={itemAnim} transition={stagger(4)}>
                    <MinimalLabel text="Комментарий" />
                    <div className="mt-3" style={{ borderTop: '1px solid var(--theme-divider)' }} />
                    <div className="mt-3">
                        <Controller
                            name="comment"
                            control={p.control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="Любые замечания по публикации..."
                                    className="min-h-24 border-0 bg-transparent px-0 text-sm font-light tracking-wide placeholder:text-sm placeholder:font-light placeholder:text-gray-300 focus-visible:ring-0"
                                />
                            )}
                        />
                        <div
                            className="mt-1"
                            style={{ borderTop: '1px solid var(--theme-divider)' }}
                        />
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    variants={itemAnim}
                    transition={stagger(5)}
                    className="flex items-center justify-between pt-4"
                >
                    <Button
                        variant="outline"
                        asChild
                        className="border-0 bg-transparent px-0 text-sm font-light tracking-wide shadow-none hover:bg-transparent hover:opacity-60"
                        style={{ color: 'var(--theme-text-muted)' }}
                    >
                        <Link to="/dashboard">Отмена</Link>
                    </Button>
                    <Button
                        onClick={p.handleSubmit(p.onSubmit)}
                        disabled={!p.isValid || p.submitting}
                        className="rounded-none px-8 text-sm font-light tracking-wide text-white"
                        style={{ backgroundColor: 'var(--theme-accent)' }}
                    >
                        {p.submitting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-2 size-4" />
                        )}
                        {p.submitting ? 'Отправка...' : 'Завершить'}
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════
   Shared: Drafts Block
   ═══════════════════════════════════════════ */

const DraftsBlock: FC<FormLayoutProps> = (p) => (
    <div
        className="rounded-sm border-2 p-6"
        style={{
            borderColor: 'oklch(0.7 0.12 75)',
            backgroundColor: 'oklch(0.97 0.05 75 / 0.5)',
        }}
    >
        <div className="flex items-center gap-2 font-bold" style={{ color: 'oklch(0.5 0.16 60)' }}>
            <AlertCircle className="size-5 shrink-0" />
            <span>Завершение недоступно</span>
        </div>
        <p className="mt-1 text-sm" style={{ color: 'oklch(0.45 0.1 60)' }}>
            Есть {p.draftIds.length}{' '}
            {p.draftIds.length === 1 ? 'черновая запись' : 'черновых записей'}, которые нужно
            отправить или удалить.
        </p>
        <ul className="mt-3 space-y-1">
            {p.draftIds.map((recordId) => (
                <li key={recordId}>
                    <Link
                        to={`/publication/${p.publ_id}/${recordId}`}
                        className="text-sm font-medium underline underline-offset-2"
                        style={{ color: 'oklch(0.5 0.16 60)' }}
                    >
                        Запись {recordId.slice(0, 8)}…
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

/* ═══════════════════════════════════════════
   Shared: Field labels
   ═══════════════════════════════════════════ */

const FieldLabelConstructivist: FC<{ icon: typeof Square; text: string }> = ({
    icon: Icon,
    text,
}) => (
    <div className="mb-2 flex items-center gap-2">
        <Icon className="size-3.5" style={{ color: 'var(--theme-accent)' }} />
        <span className="text-xs font-black tracking-[0.15em] uppercase">{text}</span>
    </div>
);

const FieldLabelHerbarium: FC<{ icon: typeof Square; text: string }> = ({ icon: Icon, text }) => (
    <div className="mb-2 flex items-center gap-2">
        <Icon className="size-3.5" style={{ color: 'var(--theme-accent)' }} />
        <span className="text-sm italic" style={{ color: 'var(--theme-text)' }}>
            {text}
        </span>
    </div>
);

const MinimalLabel: FC<{ text: string }> = ({ text }) => (
    <span
        className="text-[10px] font-semibold tracking-[0.25em] uppercase"
        style={{ color: 'var(--theme-text-muted)' }}
    >
        {text}
    </span>
);

/* ═══════════════════════════════════════════
   Shared: Corner ornaments
   ═══════════════════════════════════════════ */

const CornerOrnament: FC<{
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ position }) => {
    const posStyles: Record<string, string> = {
        'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
        'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
        'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
        'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    };
    return (
        <div
            className={`pointer-events-none absolute size-4 ${posStyles[position]}`}
            style={{ color: 'var(--theme-accent)' }}
        >
            <svg viewBox="0 0 16 16" fill="none" className="size-full">
                <path
                    d={
                        position === 'top-left'
                            ? 'M16 0H0v4m12-4H4'
                            : position === 'top-right'
                              ? 'M0 0h16v4M4 0h8'
                              : position === 'bottom-left'
                                ? 'M16 16H0v-4m12 4H4'
                                : 'M0 16h16v-4M4 16h8'
                    }
                    stroke="currentColor"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
};

/* ═══════════════════════════════════════════
   Shared: Types
   ═══════════════════════════════════════════ */

interface FormLayoutProps {
    publ_id: number;
    meta: string;
    hasDrafts: boolean;
    draftIds: string[];
    control: ReturnType<typeof useForm<SubmitForm>>['control'];
    errors: ReturnType<typeof useForm<SubmitForm>>['formState']['errors'];
    isValid: boolean;
    submitting: boolean;
    processingLevel: string | undefined;
    handleSubmit: ReturnType<typeof useForm<SubmitForm>>['handleSubmit'];
    onSubmit: (data: SubmitForm) => Promise<void>;
}
