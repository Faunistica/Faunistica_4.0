import { useState, type FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppSelector } from '@/store/store';
import { statsAPI } from '@/api/statsAPI';
import type { UserStatisticsResponse } from '@/types/api.dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Users, Database, Bug, BookOpen,
    LayoutGrid, AlignJustify, Palette,
    Gauge, Minus,
} from 'lucide-react';

type Design = 'classic' | 'compact' | 'vibrant' | 'dashboard' | 'minimal';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

const GRADIENTS = [
    'from-blue-400 to-cyan-400',
    'from-emerald-400 to-teal-400',
    'from-amber-400 to-orange-400',
    'from-violet-400 to-purple-400',
];

const ICON_BG = [
    'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
];

const projectStatCards = [
    { key: 'volunteers', icon: Users, label: 'Волонтёров', field: 'total_volunteers' as const },
    { key: 'records', icon: Database, label: 'Всего записей', field: 'total_records' as const },
    { key: 'species', icon: Bug, label: 'Видов', field: 'species_count' as const },
    { key: 'publications', icon: BookOpen, label: 'Обработано публикаций', field: 'processed_publications_count' as const },
] as const;

const personalStatCards = [
    { key: 'records', icon: Database, label: 'Записей внесено', field: 'records_entered' as const },
    { key: 'publications', icon: BookOpen, label: 'Публикаций обработано', field: 'publications_processed' as const },
] as const;

const commonLabels = [
    { key: 'family', label: 'Семейство', field: 'most_common_family' as const },
    { key: 'genus', label: 'Род', field: 'most_common_genus' as const },
    { key: 'species', label: 'Вид', field: 'most_common_species' as const },
] as const;

function formatNumber(n: number): string {
    return n.toLocaleString('ru-RU');
}

function DesignSwitch({ active, onChange }: { active: Design; onChange: (d: Design) => void }) {
    const items: { key: Design; icon: typeof LayoutGrid; label: string }[] = [
        { key: 'classic', icon: LayoutGrid, label: 'Классический' },
        { key: 'compact', icon: AlignJustify, label: 'Компактный' },
        { key: 'vibrant', icon: Palette, label: 'Цветной' },
        { key: 'dashboard', icon: Gauge, label: 'Дашборд' },
        { key: 'minimal', icon: Minus, label: 'Минимал' },
    ];
    return (
        <div className="flex rounded-lg bg-muted p-0.5">
            {items.map(({ key, icon: Icon, label }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                        active === key
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
}

function PieChartCard({
    data,
    error,
    variant = 'default',
}: {
    data: UserStatisticsResponse | undefined;
    error: boolean;
    variant?: 'default' | 'compact' | 'minimal';
}) {
    const isCompact = variant === 'compact';
    const isMinimal = variant === 'minimal';

    if (error) {
        const content = (
            <div className="py-6 text-center text-sm text-red-500">
                Не удалось загрузить статистику
            </div>
        );
        if (isMinimal) return <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">{content}</div>;
        return <Card><CardContent>{content}</CardContent></Card>;
    }
    if (!data || data.top_species.length === 0) {
        const content = (
            <div className="py-12 text-center text-sm text-muted-foreground">
                У вас пока нет записей
            </div>
        );
        if (isMinimal) return <div className="border-t pt-6">{content}</div>;
        return <Card><CardContent>{content}</CardContent></Card>;
    }

    const chart = (
        <>
            <div className={cn('flex items-center gap-2', isMinimal && 'mb-2')}>
                {!isMinimal && <Bug className="size-4" />}
                <h3 className={cn(
                    'font-medium text-muted-foreground',
                    isMinimal ? 'text-xs tracking-widest uppercase' : 'text-sm',
                )}>
                    Ваши топ-виды
                </h3>
            </div>
            <div className={cn(
                'flex flex-col items-center gap-6',
                isCompact ? 'sm:flex-row sm:items-center sm:gap-4' : 'sm:flex-row sm:items-start',
            )}>
                <ResponsiveContainer
                    width="100%"
                    height={isCompact ? 160 : isMinimal ? 200 : 240}
                    className={cn('max-w-xs shrink-0', (isCompact || isMinimal) && 'max-w-44')}
                >
                    <PieChart>
                        <Pie
                            data={data.top_species}
                            dataKey="count"
                            nameKey="species"
                            cx="50%"
                            cy="50%"
                            outerRadius={isCompact ? 60 : isMinimal ? 75 : 100}
                            innerRadius={isCompact ? 30 : isMinimal ? 38 : 50}
                        >
                            {data.top_species.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name) => [
                                formatNumber(Number(value)),
                                String(name),
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className={cn('w-full space-y-2 sm:w-auto', isMinimal && 'space-y-1.5')}>
                    {data.top_species.map((item, i) => (
                        <div key={item.species} className={cn('flex items-center gap-3', isCompact && 'text-xs', isMinimal && 'text-sm')}>
                            <span
                                className={cn('inline-block shrink-0 rounded-full', isMinimal ? 'size-2' : 'size-3')}
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="truncate">{item.species}</span>
                            <Badge
                                variant="secondary"
                                className={cn('ml-auto shrink-0 font-mono', isMinimal ? 'px-1.5 py-0 text-[10px]' : 'text-xs')}
                            >
                                {formatNumber(item.count)}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    if (isMinimal) return <div className="space-y-4">{chart}</div>;
    if (isCompact) return <Card className="gap-3 py-3"><CardHeader><CardTitle>{chart}</CardTitle></CardHeader></Card>;
    return <Card><CardHeader><CardTitle>{chart}</CardTitle></CardHeader></Card>;
}

function SectionHeading({ children, minimal }: { children: string; minimal?: boolean }) {
    if (minimal) {
        return (
            <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {children}
            </h2>
        );
    }
    return (
        <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
            {children}
        </h2>
    );
}

const Statistics: FC = () => {
    const [design, setDesign] = useState<Design>('classic');
    const userId = useAppSelector((state) => state.user.user_id);

    const {
        data: projectStats,
        isLoading: projectLoading,
        isError: projectError,
    } = statsAPI.useGetGeneralStatsQuery();

    const {
        data: userStats,
        isLoading: userLoading,
        isError: userError,
    } = statsAPI.useGetUserStatsQuery(userId!, { skip: !userId });

    const isLoading = projectLoading || userLoading;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-9 w-80" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
                            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                        </Card>
                    ))}
                </div>
                <div className="flex gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="flex-1">
                            <CardContent className="pt-4">
                                <Skeleton className="mb-2 h-4 w-20" />
                                <Skeleton className="h-5 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
                    <CardContent className="flex justify-center">
                        <Skeleton className="size-48 rounded-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (projectError) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                Не удалось загрузить статистику проекта
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
                    Статистика
                </h1>
                <DesignSwitch active={design} onChange={setDesign} />
            </div>

            {design === 'classic' && (
                <div key="classic" className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {projectStatCards.map(({ key, icon: Icon, label, field }) => (
                            <Card key={key}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Icon className="size-4" />
                                        {label}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <span className="text-3xl font-bold tracking-tight">
                                        {formatNumber(projectStats?.[field] ?? 0)}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <SectionHeading>Наиболее распространённые</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = projectStats?.[field];
                                return (
                                    <Card key={key} size="sm">
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? <span className="text-muted-foreground italic">—</span>}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <SectionHeading>Личная статистика</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {personalStatCards.map(({ key, icon: Icon, label, field }) => (
                                <Card key={key}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Icon className="size-4" />
                                            {label}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <span className="text-3xl font-bold tracking-tight">
                                            {formatNumber(userStats?.[field] ?? 0)}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <SectionHeading>Личное: наиболее распространённые</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = userStats?.[field];
                                return (
                                    <Card key={key} size="sm">
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? <span className="text-muted-foreground italic">—</span>}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <PieChartCard data={userStats} error={userError} />
                </div>
            )}

            {design === 'compact' && (
                <div key="compact" className="space-y-4">
                    <div className="space-y-2">
                        <SectionHeading>Проект</SectionHeading>
                        <div className="flex flex-wrap gap-1.5">
                            {projectStatCards.map(({ key, icon: Icon, label, field }) => (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium"
                                >
                                    <Icon className="size-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-semibold tracking-tight">
                                        {formatNumber(projectStats?.[field] ?? 0)}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <SectionHeading>Наиболее распространённые</SectionHeading>
                        <div className="flex flex-wrap gap-1.5">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = projectStats?.[field];
                                return (
                                    <span
                                        key={key}
                                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs"
                                    >
                                        <span className="text-muted-foreground">{label}:</span>
                                        <span className="font-medium">
                                            {value ?? <span className="text-muted-foreground italic">—</span>}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <SectionHeading>Личная статистика</SectionHeading>
                        <div className="flex flex-wrap gap-1.5">
                            {personalStatCards.map(({ key, icon: Icon, label, field }) => (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium"
                                >
                                    <Icon className="size-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-semibold tracking-tight">
                                        {formatNumber(userStats?.[field] ?? 0)}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <SectionHeading>Личное: наиболее распространённые</SectionHeading>
                        <div className="flex flex-wrap gap-1.5">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = userStats?.[field];
                                return (
                                    <span
                                        key={key}
                                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs"
                                    >
                                        <span className="text-muted-foreground">{label}:</span>
                                        <span className="font-medium">
                                            {value ?? <span className="text-muted-foreground italic">—</span>}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <PieChartCard data={userStats} error={userError} variant="compact" />
                </div>
            )}

            {design === 'vibrant' && (
                <div key="vibrant" className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {projectStatCards.map(({ key, icon: Icon, label, field }, idx) => (
                            <Card key={key} className="relative overflow-hidden border-0 bg-linear-to-br shadow-md" style={{
                                backgroundImage: `linear-gradient(to bottom right, ${['#eff6ff', '#ecfdf5', '#fffbeb', '#f5f3ff'][idx]}, white)`,
                            }}>
                                <div className={cn('absolute top-0 left-0 h-full w-1 bg-linear-to-b', GRADIENTS[idx % GRADIENTS.length])} />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <div className={cn('flex size-8 items-center justify-center rounded-lg', ICON_BG[idx % ICON_BG.length])}>
                                            <Icon className="size-4" />
                                        </div>
                                        {label}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <span className="text-3xl font-bold tracking-tight">
                                        {formatNumber(projectStats?.[field] ?? 0)}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <SectionHeading>Наиболее распространённые</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }, idx) => {
                                const value = projectStats?.[field];
                                return (
                                    <Card key={key} size="sm" className="relative overflow-hidden border-0 bg-linear-to-br shadow-sm" style={{
                                        backgroundImage: `linear-gradient(to bottom right, ${['#f0f9ff', '#f0fdf4', '#fefce8'][idx]}, white)`,
                                    }}>
                                        <div className={cn('absolute top-0 left-0 h-full w-0.5 bg-linear-to-b', GRADIENTS[idx % GRADIENTS.length])} />
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? <span className="text-muted-foreground italic">—</span>}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <SectionHeading>Личная статистика</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {personalStatCards.map(({ key, icon: Icon, label, field }, idx) => (
                                <Card key={key} className="relative overflow-hidden border-0 bg-linear-to-br shadow-md" style={{
                                    backgroundImage: `linear-gradient(to bottom right, ${['#fffbeb', '#f5f3ff'][idx]}, white)`,
                                }}>
                                    <div className={cn('absolute top-0 left-0 h-full w-1 bg-linear-to-b', GRADIENTS[(idx + 2) % GRADIENTS.length])} />
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <div className={cn('flex size-8 items-center justify-center rounded-lg', ICON_BG[(idx + 2) % ICON_BG.length])}>
                                                <Icon className="size-4" />
                                            </div>
                                            {label}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <span className="text-3xl font-bold tracking-tight">
                                            {formatNumber(userStats?.[field] ?? 0)}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <SectionHeading>Личное: наиболее распространённые</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }, idx) => {
                                const value = userStats?.[field];
                                return (
                                    <Card key={key} size="sm" className="relative overflow-hidden border-0 bg-linear-to-br shadow-sm" style={{
                                        backgroundImage: `linear-gradient(to bottom right, ${['#fefce8', '#f5f3ff', '#f0fdf4'][idx]}, white)`,
                                    }}>
                                        <div className={cn('absolute top-0 left-0 h-full w-0.5 bg-linear-to-b', GRADIENTS[(idx + 2) % GRADIENTS.length])} />
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? <span className="text-muted-foreground italic">—</span>}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <PieChartCard data={userStats} error={userError} />
                </div>
            )}

            {design === 'dashboard' && (
                <div key="dashboard" className="space-y-8">
                    <div className="rounded-xl border bg-card">
                        <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
                            {projectStatCards.map(({ key, icon: Icon, label, field }) => {
                                const value = projectStats?.[field] ?? 0;
                                return (
                                    <div key={key} className="flex flex-col items-center gap-1 px-4 py-6 text-center">
                                        <Icon className="size-4 text-muted-foreground/60" />
                                        <span className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                                            {formatNumber(value)}
                                        </span>
                                        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SectionHeading>Наиболее распространённые</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = projectStats?.[field];
                                return (
                                    <div key={key} className="rounded-lg border bg-card px-4 py-3">
                                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                            {label}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold tracking-tight">
                                            {value ?? <span className="text-muted-foreground italic">—</span>}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SectionHeading>Личная статистика</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {personalStatCards.map(({ key, icon: Icon, label, field }) => {
                                const value = userStats?.[field] ?? 0;
                                return (
                                    <div key={key} className="rounded-lg border bg-card px-5 py-4">
                                        <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                            <Icon className="size-3.5" />
                                            {label}
                                        </div>
                                        <span className="mt-1 block text-2xl font-bold tracking-tight">
                                            {formatNumber(value)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SectionHeading>Личное: наиболее распространённые</SectionHeading>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = userStats?.[field];
                                return (
                                    <div key={key} className="rounded-lg border bg-card px-4 py-3">
                                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                            {label}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold tracking-tight">
                                            {value ?? <span className="text-muted-foreground italic">—</span>}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <PieChartCard data={userStats} error={userError} />
                </div>
            )}

            {design === 'minimal' && (
                <div key="minimal" className="divide-y divide-border">
                    <div className="pb-8">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                            {projectStatCards.map(({ key, label, field }) => (
                                <div key={key}>
                                    <div className="text-4xl font-light tracking-tight tabular-nums sm:text-5xl">
                                        {formatNumber(projectStats?.[field] ?? 0)}
                                    </div>
                                    <p className="mt-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="py-8">
                        <SectionHeading minimal>Наиболее распространённые</SectionHeading>
                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = projectStats?.[field];
                                return (
                                    <div key={key}>
                                        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                            {label}
                                        </p>
                                        <p className="mt-1 text-base font-medium">
                                            {value ?? <span className="text-muted-foreground italic">—</span>}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="py-8">
                        <SectionHeading minimal>Личная статистика</SectionHeading>
                        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {personalStatCards.map(({ key, label, field }) => (
                                <div key={key}>
                                    <div className="text-3xl font-light tracking-tight tabular-nums">
                                        {formatNumber(userStats?.[field] ?? 0)}
                                    </div>
                                    <p className="mt-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="py-8">
                        <SectionHeading minimal>Личное: наиболее распространённые</SectionHeading>
                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = userStats?.[field];
                                return (
                                    <div key={key}>
                                        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                            {label}
                                        </p>
                                        <p className="mt-1 text-base font-medium">
                                            {value ?? <span className="text-muted-foreground italic">—</span>}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-8">
                        <PieChartCard data={userStats} error={userError} variant="minimal" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Statistics;
