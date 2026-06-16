import { type FC, useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/store/store';
import { statsAPI } from '@/api/statsAPI';
import { recordAPI } from '@/api/recordAPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Download,
    Users,
    Database,
    Bug,
    BookOpen,
    ShieldCheck,
    XCircle,
    Calendar,
    TrendingUp,
    Layers,
    Search,
    ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { StatisticsSkeleton } from '@/components/statistics/Skeleton';
import { PieChartCard } from '@/components/statistics/PieChartCard';
import { CumulativeChart } from '@/components/statistics/CumulativeChart';
import type { ProgressInfo } from '@/types/api.dto';
import { useTranslation } from 'react-i18next';

const projectCards = [
    { key: 'species', icon: Bug, field: 'species_count' as const },
    {
        key: 'publications',
        icon: BookOpen,
        field: 'processed_publications_count' as const,
    },
    { key: 'total_users', icon: Users, field: 'total_users' as const },
    { key: 'families', icon: Layers, field: 'families_count' as const },
    { key: 'records', icon: Database, field: 'total_records' as const },
    { key: 'checks', icon: ShieldCheck, field: 'checks_count' as const },
    { key: 'failed', icon: XCircle, field: 'failed_records' as const },
] as const;

const personalMainCards = [
    { key: 'records', icon: Database, field: 'records_entered' as const },
    {
        key: 'publications',
        icon: BookOpen,
        field: 'publications_processed' as const,
    },
] as const;

const personalDetailedCards = [
    {
        key: 'individuals',
        icon: Users,
        field: 'total_individuals' as const,
    },
    { key: 'species', icon: Bug, field: 'distinct_species' as const },
    { key: 'families', icon: Layers, field: 'distinct_families' as const },
    { key: 'genera', icon: Layers, field: 'distinct_genera' as const },
    { key: 'checks', icon: ShieldCheck, field: 'checks_count' as const },
    { key: 'failed', icon: XCircle, field: 'failed_records' as const },
] as const;

const commonLabels = [
    { key: 'family', field: 'most_common_family' as const },
    { key: 'genus', field: 'most_common_genus' as const },
    { key: 'species', field: 'most_common_species' as const },
] as const;

function formatNumber(n: number, locale = 'ru-RU'): string {
    return n.toLocaleString(locale);
}

function Value({ value }: { value: number | string | null | undefined }) {
    if (value == null) return <span className="text-muted-foreground italic">—</span>;
    return <>{typeof value === 'number' ? formatNumber(value) : value}</>;
}

function StatCard({
    icon: Icon,
    label,
    value,
    children,
}: {
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
            <CardContent>
                <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">
                    <Value value={value} />
                </p>
            </CardContent>
        </Card>
    );
}

function getStatLabel(key: string, t: (s: string) => string): string {
    const translationKey = STAT_LABEL_KEYS[key];
    return translationKey ? t(translationKey) : key;
}

function ProgressCard({ progress, t, locale }: { progress: ProgressInfo; t: (s: string, opts?: Record<string, unknown>) => string; locale: string }) {
    const [animate, setAnimate] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const total = progress.total_publications;
    const processedPct =
        total > 0 ? Math.min((progress.processed_publications / total) * 100, 100) : 0;
    const fullyPct =
        total > 0 ? Math.min((progress.fully_processed_publications / total) * 100, 100) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="size-4" />
                    {t('statistics.progressTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('statistics.coverage')}</span>
                    <span className="font-semibold">{(progress.coverage * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="relative h-full">
                        <div
                            className="absolute inset-0 rounded-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: animate ? `${processedPct}%` : '0%' }}
                        />
                        <div
                            className="absolute inset-0 rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                            style={{ width: animate ? `${fullyPct}%` : '0%' }}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-emerald-500" />
                            {t('statistics.fullyProcessed')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-primary" />
                            {t('statistics.partiallyProcessed')}
                        </span>
                    </div>
                    <div className="font-medium text-emerald-500">
                        {((progress.fully_processed_publications / total) * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                        {t('statistics.processed')}: {formatNumber(progress.processed_publications, locale)}
                        {progress.fully_processed_publications > 0 && (
                            <>
                                {' '}
                                {t('statistics.ofWhichFully', { count: formatNumber(progress.fully_processed_publications, locale) })}
                            </>
                        )}
                    </span>
                    <span>{t('statistics.total')}: {formatNumber(total, locale)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

const STAT_LABEL_KEYS: Record<string, string> = {
    species: 'statistics.labelSpecies',
    publications: 'statistics.labelPublications',
    total_users: 'statistics.labelUsers',
    families: 'statistics.labelFamilies',
    records: 'statistics.labelRecords',
    checks: 'statistics.labelChecks',
    failed: 'statistics.labelFailed',
    records_entered: 'statistics.labelRecordsEntered',
    publications_processed: 'statistics.labelPublicationsProcessed',
    individuals: 'statistics.labelTotalIndividuals',
    species_identified: 'statistics.labelSpeciesIdentified',
    genera: 'statistics.labelGenera',
    family: 'statistics.labelFamily',
    genus: 'statistics.labelGenus',
};

const Statistics: FC = () => {
    const { t, i18n } = useTranslation();
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

    const [downloadReport] = statsAPI.useDownloadReportMutation();
    const [exportAllRecords] = recordAPI.useExportAllRecordsMutation();

    const [fiendName, setFiendName] = useState<string | null>(
        () => new URLSearchParams(window.location.search).get('name') || null,
    );
    const [searchInput, setSearchInput] = useState(fiendName ?? '');

    const doSearch = useCallback((name: string | null) => {
        setFiendName(name);
        const url = new URL(window.location.href);
        if (name) url.searchParams.set('name', name);
        else url.searchParams.delete('name');
        window.history.replaceState(null, '', url.toString());
    }, []);

    const {
        data: fiendStats,
        isLoading: fiendLoading,
        isError: fiendError,
    } = statsAPI.useGetUserStatsByNameQuery(fiendName!, { skip: !fiendName });

    const isLoading = projectLoading || userLoading;

    const displayStats = fiendName ? fiendStats : userStats;

    if (isLoading) {
        return <StatisticsSkeleton />;
    }

    if (projectError) {
        return (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                {t('statistics.pageError')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
                    {t('statistics.title')}
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportAllRecords()}>
                        <Download className="mr-2 size-4" />
                        {t('statistics.downloadRecords')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadReport()}>
                        <Download className="mr-2 size-4" />
                        {t('statistics.downloadReport')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {projectCards.slice(0, 4).map(({ key, icon, field }) => (
                    <StatCard key={key} icon={icon} label={getStatLabel(key, t)} value={projectStats?.[field]} />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {projectCards.slice(4).map(({ key, icon, field }) => (
                    <StatCard key={key} icon={icon} label={getStatLabel(key, t)} value={projectStats?.[field]} />
                ))}
            </div>

            {projectStats?.progress && <ProgressCard progress={projectStats.progress} t={t} locale={i18n.language} />}

            {projectStats &&
                (projectStats.cumulative_records.length > 0 ||
                    projectStats.cumulative_volunteers.length > 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <TrendingUp className="size-4" />
                                {t('statistics.projectDynamics')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {projectStats.cumulative_records.length > 0 && (
                                    <CumulativeChart
                                        data={projectStats.cumulative_records}
                                        title={t('statistics.cumulativeRecords')}
                                        tooltipLabel={t('statistics.cumulativeRecords')}
                                        lineColor="#3b82f6"
                                    />
                                )}
                                {projectStats.cumulative_volunteers.length > 0 && (
                                    <CumulativeChart
                                        data={projectStats.cumulative_volunteers}
                                        title={t('statistics.totalVolunteers')}
                                        tooltipLabel={t('statistics.totalVolunteers')}
                                        lineColor="#22c55e"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

            <div className="space-y-3">
                <div className="flex items-end justify-between">
                    <h2 className="mb-3 font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
                        {fiendName
                            ? t('statistics.userStatsTitle', { name: fiendStats?.name ?? fiendName })
                            : t('statistics.personalStatsTitle')}
                    </h2>
                    <div className="flex h-16 flex-col-reverse items-end justify-baseline">
                        <Card className="mb-1 flex flex-row items-center gap-3 p-1">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('statistics.searchPlaceholder')}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            doSearch(searchInput.trim() || null);
                                        }
                                    }}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                variant="default"
                                onClick={() => doSearch(searchInput.trim() || null)}
                                disabled={!searchInput.trim()}
                            >
                                {t('statistics.searchButton')}
                            </Button>
                        </Card>
                        {fiendName && (
                            <Button
                                className="px-0"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    doSearch(null);
                                    setSearchInput('');
                                }}
                            >
                                <ArrowLeft className="size-4" />
                                {t('statistics.backToPersonal')}
                            </Button>
                        )}
                    </div>
                </div>

                {fiendName && fiendLoading && <StatisticsSkeleton />}
                {fiendName && fiendError && (
                    <p className="text-sm text-red-500">{t('statistics.userNotFound', { name: fiendName })}</p>
                )}
                {(!fiendName || (fiendStats && !fiendLoading)) && (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {personalMainCards.map(({ key, icon, field }) => (
                                <StatCard
                                    key={key}
                                    icon={icon}
                                    label={getStatLabel(key, t)}
                                    value={displayStats?.[field]}
                                />
                            ))}
                            {personalDetailedCards
                                .slice(0, 4)
                                .map(({ key, icon, field }) => (
                                    <StatCard
                                        key={key}
                                        icon={icon}
                                        label={getStatLabel(key === 'species' ? 'species_identified' : key, t)}
                                        value={displayStats?.[field]}
                                    />
                                ))}
                        </div>
                        <div
                            className={cn(
                                'grid grid-cols-1 gap-4 sm:grid-cols-2',
                                displayStats?.most_common_year != null
                                    ? 'lg:grid-cols-3'
                                    : 'lg:grid-cols-2',
                            )}
                        >
                            {personalDetailedCards.slice(4).map(({ key, icon, field }) => (
                                <StatCard
                                    key={key}
                                    icon={icon}
                                    label={getStatLabel(key, t)}
                                    value={displayStats?.[field]}
                                />
                            ))}
                            {displayStats?.most_common_year != null && (
                                <StatCard
                                    icon={Calendar}
                                    label={t('statistics.mostCommonYear')}
                                    value={displayStats.most_common_year}
                                />
                            )}
                        </div>
                        <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
                            {t('statistics.mostCommon')}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {commonLabels.map(({ key, field }) => (
                                <LabelCard key={key} label={getStatLabel(key, t)} value={displayStats?.[field]} />
                            ))}
                        </div>
                        <PieChartCard
                            data={displayStats}
                            error={fiendName ? fiendError : userError}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Statistics;
