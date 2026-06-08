import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { UserStatisticsResponse } from "@/types/api.dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug } from "lucide-react";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export function PieChartCard({
  data,
  error,
}: {
  data: UserStatisticsResponse | undefined;
  error: boolean;
}) {
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
              <Tooltip formatter={(value, name) => [formatNumber(Number(value)), String(name)]} />
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
