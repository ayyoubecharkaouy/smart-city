"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Loader } from "lucide-react";

export type ChartType =
  | "column"
  | "nightingale"
  | "table"
  | "pie"
  | "gauge"
  | "line";

interface AnalyticsChartProps {
  type: ChartType;
  data: any[];
  loading: boolean;
  color?: string;
  label?: string;
  unit?: string;
  xAxisKey?: string;
  yAxisKey?: string;
}

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#f59e0b",
];

export default function AnalyticsChart({
  type,
  data,
  loading,
  color = "#3b82f6",
  label = "Valeur",
  unit = "",
  xAxisKey = "name",
  yAxisKey = "value",
}: AnalyticsChartProps) {
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        <Loader className="w-10 h-10 text-gray-300 animate-spin mb-4" />
        <p className="text-gray-400 font-medium">
          Traitement des données Big Data...
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">
          Aucune donnée disponible pour cette sélection.
        </p>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#1a1a1a", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#1a1a1a", fontSize: 12 }}
                unit={unit}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000000",
                  borderRadius: "16px",
                  border: "none",
                  color: "#fff",
                  padding: "8px 12px",
                }}
                itemStyle={{ color: color, fontWeight: 700 }}
              />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke={color}
                strokeWidth={4}
                dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "column":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              barCategoryGap="8%"
              barGap={0}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />

              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                unit={unit}
              />

              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />

              <Bar
                dataKey={yAxisKey}
                radius={[8, 8, 0, 0]}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <defs>
                {COLORS.map((color, index) => (
                  <linearGradient
                    key={`pieGradient-${index}`}
                    id={`pieGradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>

              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={4}
                cornerRadius={8}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                animationDuration={1200}
                animationEasing="ease-out"
                stroke="#ffffff"
                strokeWidth={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#pieGradient-${index % COLORS.length})`}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                  padding: "10px 12px",
                }}
                labelStyle={{
                  color: "#334155",
                  fontWeight: 700,
                }}
                itemStyle={{
                  color: "#0f172a",
                  fontWeight: 600,
                }}
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()}${unit ? ` ${unit}` : ""}`,
                  name,
                ]}
              />

              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={9}
                height={44}
                wrapperStyle={{
                  paddingTop: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case "nightingale":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={(entry: any) =>
                  60 +
                  (entry.value / Math.max(...data.map((d) => d.value))) * 60
                }
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                animationDuration={1500}
                label={({ name, percent }) =>
                  `${name} ${(percent ?? 0 * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    // Vary radius based on value for Nightingale effect
                    strokeWidth={2}
                    stroke="#fff"
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "gauge":
        const maxVal = Math.max(...data.map((d) => d.value)) * 1.2 || 100;
        const gaugeData = data.slice(0, 5).map((d, i) => ({
          name: d[xAxisKey],
          value: d[yAxisKey],
          fill: COLORS[i % COLORS.length],
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="100%"
              barSize={15}
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                label={{ position: "insideStart", fill: "#fff", fontSize: 10 }}
                background
                dataKey="value"
                animationDuration={1500}
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                wrapperStyle={{ right: 0 }}
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case "table":
        return (
          <div className="h-full w-full overflow-hidden rounded-4xl border border-slate-100 bg-white">
            <div className="h-full w-full overflow-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {xAxisKey}
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {data.map((row, i) => (
                    <tr
                      key={i}
                      className="group transition-colors hover:bg-slate-50"
                    >
                      <td className="max-w-[260px] truncate px-5 py-4 text-sm font-semibold text-slate-700">
                        {row[xAxisKey]}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-sm font-extrabold tabular-nums text-slate-900">
                          {Number(row[yAxisKey] ?? 0).toLocaleString()}
                        </span>

                        {unit && (
                          <span className="ml-1 text-[11px] font-semibold text-slate-400">
                            {unit}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="w-full h-full p-4">{renderChart()}</div>;
}
