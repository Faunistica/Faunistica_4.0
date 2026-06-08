import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CumulativePoint } from "@/types/api.dto";

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function CumulativeChart({
  data,
  title,
  tooltipLabel,
  lineColor,
}: {
  data: CumulativePoint[];
  title: string;
  tooltipLabel: string;
  lineColor: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <ResponsiveContainer width="100%" aspect={2}>
        <LineChart data={data}>
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
            formatter={(value) => [formatNumber(Number(value)), tooltipLabel]}
            labelFormatter={(v) => new Date(v).toLocaleDateString("ru-RU")}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
