import { type FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppSelector } from '@/store/store';
import { statsAPI } from '@/api/statsAPI';
import type { UserStatisticsResponse } from '@/types/api.dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, Database, Bug, BookOpen, ShieldCheck, XCircle, Calendar, TrendingUp, Layers } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

const projectMainCards = [
    { key: 'volunteers', icon: Users, label: 'Волонтёров', field: 'total_volunteers' as const },
    { key: 'records', icon: Database, label: 'Всего записей', field: 'total_records' as const },
    { key: 'species', icon: Bug, label: 'Видов', field: 'species_count' as const },
    { key: 'publications', icon: BookOpen, label: 'Обработано публикаций', field: 'processed_publications_count' as const },
] as const;

const projectSecondaryCards = [
    { key: 'total_users', icon: Users, label: 'Пользователей', field: 'total_users' as const },
    { key: 'families', icon: Layers, label: 'Семейств', field: 'families_count' as const },
    { key: 'checks', icon: ShieldCheck, label: 'Проверок', field: 'checks_count' as const },
    { key: 'failed', icon: XCircle, label: 'Ошибочных записей', field: 'failed_records' as const },
] as const;

const personalMainCards = [
    { key: 'records', icon: Database, label: 'Записей внесено', field: 'records_entered' as const },
    { key: 'publications', icon: BookOpen, label: 'Публикаций обработано', field: 'publications_processed' as const },
] as const;

const personalDetailedCards = [
    { key: 'individuals', icon: Users, label: 'Всего экземпляров', field: 'total_individuals' as const },
    { key: 'species', icon: Bug, label: 'Видов определено', field: 'distinct_species' as const },
    { key: 'families', icon: Layers, label: 'Семейств', field: 'distinct_families' as const },
    { key: 'genera', icon: Layers, label: 'Родов', field: 'distinct_genera' as const },
    { key: 'checks', icon: ShieldCheck, label: 'Проверок', field: 'checks_count' as const },
    { key: 'failed', icon: XCircle, label: 'Ошибочных записей', field: 'failed_records' as const },
] as const;

const commonLabels = [
    { key: 'family', label: 'Семейство', field: 'most_common_family' as const },
    { key: 'genus', label: 'Род', field: 'most_common_genus' as const },
    { key: 'species', label: 'Вид', field: 'most_common_species' as const },
] as const;

function formatNumber(n: number): string {
    return n.toLocaleString('ru-RU');
}

function PieChartCard({ data, error }: { data: UserStatisticsResponse | undefined; error: boolean }) {
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Bug className="size-4" />
                    Ваши топ-виды
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    <ResponsiveContainer width="100%" height={240} className="max-w-xs shrink-0">
                        <PieChart>
                            <Pie
                                data={data.top_species}
                                dataKey="count"
                                nameKey="species"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                innerRadius={50}
                            >
                                {data.top_species.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
                            <div key={item.species} className="flex items-center gap-3 text-sm">
                                <span
                                    className="inline-block size-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                />
                                <span className="truncate">{item.species}</span>
                                <Badge variant="secondary" className="ml-auto shrink-0 font-mono text-xs">
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

function Value({ value }: { value: number | string | null | undefined }) {
    if (value == null) return <span className="text-muted-foreground italic">—</span>;
    return <>{typeof value === 'number' ? formatNumber(value) : value}</>;
}

function StatCard({ icon: Icon, label, value, children }: {
    icon?: typeof Users;
    label: string;
    value?: number | string | null;
    children?: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {Icon && <Icon className="size-4" />}
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {children ?? (
                    <span className="text-3xl font-bold tracking-tight">
                        <Value value={value} />
                    </span>
                )}
            </CardContent>
        </Card>
    );
}

function LabelCard({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <Card size="sm">
            <CardContent className="pt-3">
                <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium"><Value value={value} /></p>
            </CardContent>
        </Card>
    );
}

const Statistics: FC = () => {
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
                <Skeleton className="h-7 w-32" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
                            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                        </Card>
                    ))}
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
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
            <h1 className="text-lg font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
                Статистика
            </h1>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {projectMainCards.map(({ key, icon, label, field }) => (
                    <StatCard key={key} icon={icon} label={label} value={projectStats?.[field]} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {projectSecondaryCards.map(({ key, icon, label, field }) => (
                    <StatCard key={key} icon={icon} label={label} value={projectStats?.[field]} />
                ))}
            </div>

            {projectStats?.progress && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <BookOpen className="size-4" />
                            Прогресс оцифровки
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Охват</span>
                            <span className="font-semibold">
                                {(projectStats.progress.coverage * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${projectStats.progress.coverage * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Обработано: {formatNumber(projectStats.progress.processed_publications)}</span>
                            <span>Всего: {formatNumber(projectStats.progress.total_publications)}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {projectStats && (projectStats.cumulative_records.length > 0 || projectStats.cumulative_volunteers.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <TrendingUp className="size-4" />
                            Динамика проекта
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {projectStats.cumulative_records.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Накоплено записей
                                    </p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={projectStats.cumulative_records}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(v) => {
                                                    const d = new Date(v);
                                                    return `${d.getMonth() + 1}.${d.getFullYear().toString().slice(2)}`;
                                                }}
                                                className="text-muted-foreground"
                                            />
                                            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                                            <Tooltip
                                                formatter={(value) => [formatNumber(Number(value)), 'Записей']}
                                                labelFormatter={(v) => new Date(v).toLocaleDateString('ru-RU')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            {projectStats.cumulative_volunteers.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Накоплено волонтёров
                                    </p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={projectStats.cumulative_volunteers}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(v) => {
                                                    const d = new Date(v);
                                                    return `${d.getMonth() + 1}.${d.getFullYear().toString().slice(2)}`;
                                                }}
                                                className="text-muted-foreground"
                                            />
                                            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                                            <Tooltip
                                                formatter={(value) => [formatNumber(Number(value)), 'Волонтёров']}
                                                labelFormatter={(v) => new Date(v).toLocaleDateString('ru-RU')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#22c55e"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                <SectionHeading>Личная статистика</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {personalMainCards.map(({ key, icon, label, field }) => (
                        <StatCard key={key} icon={icon} label={label} value={userStats?.[field]} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {personalDetailedCards.map(({ key, icon, label, field }) => (
                    <StatCard key={key} icon={icon} label={label} value={userStats?.[field]} />
                ))}
                {userStats?.most_common_year != null && (
                    <StatCard icon={Calendar} label="Чаще всего год" value={userStats.most_common_year} />
                )}
            </div>

            <div className="space-y-3">
                <SectionHeading>Личное: наиболее распространённые</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {commonLabels.map(({ key, label, field }) => (
                        <LabelCard key={key} label={label} value={userStats?.[field]} />
                    ))}
                </div>
            </div>

            <PieChartCard data={userStats} error={userError} />
        </div>
    );
};

export default Statistics;
