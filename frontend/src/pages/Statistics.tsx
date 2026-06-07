import { useState, type FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppSelector } from '@/store/store';
import { statsAPI } from '@/api/statsAPI';
import type { UserStatisticsResponse } from '@/types/api.dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, Database, Bug, BookOpen, FileEdit, Layers } from 'lucide-react';

type Tab = 'project' | 'personal';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

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

function TabSwitch({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
    const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
        { key: 'project', label: 'Проект', icon: Layers },
        { key: 'personal', label: 'Личная', icon: FileEdit },
    ];
    return (
        <div className="flex rounded-lg bg-muted p-0.5">
            {tabs.map(({ key, label, icon: Icon }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                        active === key
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Icon className="size-4" />
                    {label}
                </button>
            ))}
        </div>
    );
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
                                className="flex items-center gap-3 text-sm"
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

const Statistics: FC = () => {
    const [tab, setTab] = useState<Tab>('project');
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
                <TabSwitch active={tab} onChange={setTab} />
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
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
                Не удалось загрузить статистику проекта
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 uppercase">
                    Статистика
                </h1>
                <TabSwitch active={tab} onChange={setTab} />
            </div>

            {tab === 'project' && (
                <>
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

                    <div>
                        <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-900 uppercase">
                            Наиболее распространённые
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = projectStats?.[field];
                                return (
                                    <Card key={key} size="sm">
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? (
                                                    <span className="italic text-muted-foreground">—</span>
                                                )}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <PieChartCard data={userStats} error={userError} />
                </>
            )}

            {tab === 'personal' && (
                <>
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

                    <div>
                        <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-900 uppercase">
                            Личное: наиболее распространённые
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, label, field }) => {
                                const value = userStats?.[field];
                                return (
                                    <Card key={key} size="sm">
                                        <CardContent className="pt-3">
                                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium">
                                                {value ?? (
                                                    <span className="italic text-muted-foreground">—</span>
                                                )}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <PieChartCard data={userStats} error={userError} />
                </>
            )}
        </div>
    );
};

export default Statistics;
