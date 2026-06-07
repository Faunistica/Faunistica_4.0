import { useState, type FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppSelector } from '@/store/store';
import { statsAPI } from '@/api/statsAPI';
import type { UserStatisticsResponse } from '@/types/api.dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, Database, Bug, BookOpen, LayoutGrid, AlignJustify, Palette } from 'lucide-react';

type Design = 'classic' | 'compact' | 'vibrant';

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
    const designs: { key: Design; icon: typeof LayoutGrid; label: string }[] = [
        { key: 'classic', icon: LayoutGrid, label: 'Классический' },
        { key: 'compact', icon: AlignJustify, label: 'Компактный' },
        { key: 'vibrant', icon: Palette, label: 'Яркий' },
    ];
    return (
        <div className="flex rounded-lg bg-muted p-0.5">
            {designs.map(({ key, icon: Icon, label }) => (
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

function PieChartCard({ data, error, compact }: { data: UserStatisticsResponse | undefined; error: boolean; compact?: boolean }) {
    if (error) {
        return (
            <Card>
                <CardContent className="py-6 text-center text-sm text-red-500">
                    Не удалось загрузить статистику
                </CardContent>
            </Card>
        );
    }
    if (!data || data.top_species.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    У вас пока нет записей
                </CardContent>
            </Card>
        );
    }
    return (
        <Card className={cn(compact && 'gap-3 py-3')}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Bug className="size-4" />
                    Ваши топ-виды
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    'flex flex-col items-center gap-6',
                    compact ? 'sm:flex-row sm:items-center sm:gap-4' : 'sm:flex-row sm:items-start',
                )}>
                    <ResponsiveContainer
                        width="100%"
                        height={compact ? 160 : 240}
                        className={cn('max-w-xs shrink-0', compact && 'max-w-36')}
                    >
                        <PieChart>
                            <Pie
                                data={data.top_species}
                                dataKey="count"
                                nameKey="species"
                                cx="50%"
                                cy="50%"
                                outerRadius={compact ? 60 : 100}
                                innerRadius={compact ? 30 : 50}
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
                    <div className="w-full space-y-2 sm:w-auto">
                        {data.top_species.map((item, i) => (
                            <div
                                key={item.species}
                                className={cn('flex items-center gap-3', compact && 'text-xs')}
                            >
                                <span
                                    className="inline-block size-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className="truncate">{item.species}</span>
                                <Badge
                                    variant="secondary"
                                    className="ml-auto shrink-0 font-mono text-xs"
                                >
                                    {formatNumber(item.count)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SectionHeading({ children }: { children: string }) {
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
                    <Skeleton className="h-9 w-64" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
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
                    <CardHeader>
                        <Skeleton className="h-5 w-32" />
                    </CardHeader>
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
                                                {value ?? (
                                                    <span className="text-muted-foreground italic">—</span>
                                                )}
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
                                                {value ?? (
                                                    <span className="text-muted-foreground italic">—</span>
                                                )}
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
                <div key="compact" className="space-y-5">
                    <div className="space-y-2">
                        <SectionHeading>Проект</SectionHeading>
                        <div className="flex flex-wrap gap-2">
                            {projectStatCards.map(({ key, icon: Icon, label, field }) => (
                                <div
                                    key={key}
                                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs"
                                >
                                    <Icon className="size-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-semibold tracking-tight">
                                        {formatNumber(projectStats?.[field] ?? 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <SectionHeading>Наиболее распространённые</SectionHeading>
                        <div className="flex flex-wrap gap-2">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = projectStats?.[field];
                                return (
                                    <div
                                        key={key}
                                        className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs"
                                    >
                                        <span className="text-xs text-muted-foreground">{label}:</span>
                                        <span className="font-medium">
                                            {value ?? (
                                                <span className="text-muted-foreground italic">—</span>
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <SectionHeading>Личная статистика</SectionHeading>
                        <div className="flex flex-wrap gap-2">
                            {personalStatCards.map(({ key, icon: Icon, label, field }) => (
                                <div
                                    key={key}
                                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs"
                                >
                                    <Icon className="size-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-semibold tracking-tight">
                                        {formatNumber(userStats?.[field] ?? 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <SectionHeading>Личное: наиболее распространённые</SectionHeading>
                        <div className="flex flex-wrap gap-2">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = userStats?.[field];
                                return (
                                    <div
                                        key={key}
                                        className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs"
                                    >
                                        <span className="text-xs text-muted-foreground">{label}:</span>
                                        <span className="font-medium">
                                            {value ?? (
                                                <span className="text-muted-foreground italic">—</span>
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <PieChartCard data={userStats} error={userError} compact />
                </div>
            )}

            {design === 'vibrant' && (
                <div key="vibrant" className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {projectStatCards.map(({ key, icon: Icon, label, field }, idx) => (
                            <Card key={key} className="relative overflow-hidden">
                                <div
                                    className={cn(
                                        'absolute top-0 left-0 h-full w-1 bg-linear-to-b',
                                        GRADIENTS[idx % GRADIENTS.length],
                                    )}
                                />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <div
                                            className={cn(
                                                'flex size-7 items-center justify-center rounded-md',
                                                ICON_BG[idx % ICON_BG.length],
                                            )}
                                        >
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
                                    <Card key={key} size="sm" className="relative overflow-hidden">
                                        <div
                                            className={cn(
                                                'absolute top-0 left-0 h-full w-0.5 bg-linear-to-b',
                                                GRADIENTS[idx % GRADIENTS.length],
                                            )}
                                        />
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? (
                                                    <span className="text-muted-foreground italic">—</span>
                                                )}
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
                                <Card key={key} className="relative overflow-hidden">
                                    <div
                                        className={cn(
                                            'absolute top-0 left-0 h-full w-1 bg-linear-to-b',
                                            GRADIENTS[(idx + 2) % GRADIENTS.length],
                                        )}
                                    />
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <div
                                                className={cn(
                                                    'flex size-7 items-center justify-center rounded-md',
                                                    ICON_BG[(idx + 2) % ICON_BG.length],
                                                )}
                                            >
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
                                    <Card key={key} size="sm" className="relative overflow-hidden">
                                        <div
                                            className={cn(
                                                'absolute top-0 left-0 h-full w-0.5 bg-linear-to-b',
                                                GRADIENTS[(idx + 2) % GRADIENTS.length],
                                            )}
                                        />
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? (
                                                    <span className="text-muted-foreground italic">—</span>
                                                )}
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
        </div>
    );
};

export default Statistics;
