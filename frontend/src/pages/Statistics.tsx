import { type FC } from "react";
import { useAppSelector } from "@/store/store";
import { statsAPI } from "@/api/statsAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { StatisticsSkeleton } from "@/components/statistics/Skeleton";
import { PieChartCard } from "@/components/statistics/PieChartCard";
import { CumulativeChart } from "@/components/statistics/CumulativeChart";

const projectCards = [
  { key: "species", icon: Bug, label: "Видов", field: "species_count" as const },
  {
    key: "publications",
    icon: BookOpen,
    label: "Обработано публикаций",
    field: "processed_publications_count" as const,
  },
  { key: "total_users", icon: Users, label: "Пользователей", field: "total_users" as const },
  { key: "families", icon: Layers, label: "Семейств", field: "families_count" as const },
  { key: "records", icon: Database, label: "Всего записей", field: "total_records" as const },
  { key: "checks", icon: ShieldCheck, label: "Проверок", field: "checks_count" as const },
  { key: "failed", icon: XCircle, label: "Ошибочных записей", field: "failed_records" as const },
] as const;

const personalMainCards = [
  { key: "records", icon: Database, label: "Записей внесено", field: "records_entered" as const },
  {
    key: "publications",
    icon: BookOpen,
    label: "Публикаций обработано",
    field: "publications_processed" as const,
  },
] as const;

const personalDetailedCards = [
  {
    key: "individuals",
    icon: Users,
    label: "Всего экземпляров",
    field: "total_individuals" as const,
  },
  { key: "species", icon: Bug, label: "Видов определено", field: "distinct_species" as const },
  { key: "families", icon: Layers, label: "Семейств", field: "distinct_families" as const },
  { key: "genera", icon: Layers, label: "Родов", field: "distinct_genera" as const },
  { key: "checks", icon: ShieldCheck, label: "Проверок", field: "checks_count" as const },
  { key: "failed", icon: XCircle, label: "Ошибочных записей", field: "failed_records" as const },
] as const;

const commonLabels = [
  { key: "family", label: "Семейство", field: "most_common_family" as const },
  { key: "genus", label: "Род", field: "most_common_genus" as const },
  { key: "species", label: "Вид", field: "most_common_species" as const },
] as const;

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

function Value({ value }: { value: number | string | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground italic">—</span>;
  return <>{typeof value === "number" ? formatNumber(value) : value}</>;
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

  const [downloadReport] = statsAPI.useDownloadReportMutation();

  const isLoading = projectLoading || userLoading;

  if (isLoading) {
    return <StatisticsSkeleton />;
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
        <Button variant="outline" size="sm" onClick={() => downloadReport()}>
          <Download className="mr-2 size-4" />
          Скачать отчёт
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {projectCards.slice(0, 4).map(({ key, icon, label, field }) => (
          <StatCard key={key} icon={icon} label={label} value={projectStats?.[field]} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {projectCards.slice(4).map(({ key, icon, label, field }) => (
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

      {projectStats &&
        (projectStats.cumulative_records.length > 0 ||
          projectStats.cumulative_volunteers.length > 0) && (
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
                  <CumulativeChart
                    data={projectStats.cumulative_records}
                    title="Накоплено записей"
                    tooltipLabel="Записей"
                    lineColor="#3b82f6"
                  />
                )}
                {projectStats.cumulative_volunteers.length > 0 && (
                  <CumulativeChart
                    data={projectStats.cumulative_volunteers}
                    title="Всего волонтёров"
                    tooltipLabel="Волонтёров"
                    lineColor="#22c55e"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

      <div className="space-y-3">
        <h2 className="font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
          Личная статистика
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personalMainCards.map(({ key, icon, label, field }) => (
            <StatCard key={key} icon={icon} label={label} value={userStats?.[field]} />
          ))}
          {personalDetailedCards.map(({ key, icon, label, field }) => (
            <StatCard key={key} icon={icon} label={label} value={userStats?.[field]} />
          ))}
          {userStats?.most_common_year != null && (
            <StatCard icon={Calendar} label="Чаще всего год" value={userStats.most_common_year} />
          )}
        </div>
        <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
          Наиболее распространённые
        </h2>
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
